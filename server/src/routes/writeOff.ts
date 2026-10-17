import { Router, Response } from 'express';
import { Role, WriteOffStatus, StockEventType, UnitOfMeasure, SeverityLevel } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, requireRole, verifyAwcScope } from '../middleware/auth';
import { LedgerService } from '../services/ledgerService';
import { AuditService } from '../services/auditService';

const router = Router();

const createWriteOffSchema = z.object({
  awcId: z.string().uuid(),
  itemId: z.string().uuid(),
  batchNumber: z.string().optional(),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unit: z.nativeEnum(UnitOfMeasure),
  reasonCode: z.string().min(1, 'Reason code is required'),
  explanation: z.string().optional(),
  voiceNoteTranscript: z.string().optional(),
  photoUrl: z.string().optional(),
  clientOperationId: z.string().optional(),
});

// POST /api/write-off — AWW reports damaged, spoiled, or expired stock
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const parse = createWriteOffSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const data = parse.data;
    const user = req.user!;

    const isAuthorized = await verifyAwcScope(user, data.awcId);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Scope violation: Unauthorized.' });
    }

    // Idempotency check
    if (data.clientOperationId) {
      const existingSync = await prisma.syncLog.findUnique({
        where: { clientOperationId: data.clientOperationId },
      });
      if (existingSync) {
        return res.status(200).json({
          status: 'DUPLICATE_IGNORED',
          message: 'Write-off report has already been processed idempotently.',
        });
      }
    }

    const count = await prisma.writeOffRequest.count();
    const caseNumber = `WRO-2026-${String(count + 1).padStart(4, '0')}`;

    // Approval threshold: >= 5 packets or >= 2.5 kg requires CDPO approval
    const isHighQuantity = data.quantity >= 5;
    const initialStatus: WriteOffStatus = isHighQuantity
      ? WriteOffStatus.PENDING_CDPO
      : WriteOffStatus.PENDING_SUPERVISOR;

    const item = await prisma.item.findUnique({ where: { id: data.itemId } });

    const result = await prisma.$transaction(async (tx) => {
      const writeOff = await tx.writeOffRequest.create({
        data: {
          caseNumber,
          awcId: data.awcId,
          itemId: data.itemId,
          batchNumber: data.batchNumber,
          quantity: data.quantity,
          unit: data.unit,
          reasonCode: data.reasonCode,
          explanation: data.explanation,
          voiceNoteTranscript: data.voiceNoteTranscript,
          photoUrl: data.photoUrl,
          status: initialStatus,
          reportedByUserId: user.id,
          clientOperationId: data.clientOperationId,
        },
      });

      // Alert designated approver
      const targetRole = isHighQuantity ? Role.CDPO : Role.SUPERVISOR;
      await tx.alert.create({
        data: {
          recipientRole: targetRole,
          awcId: data.awcId,
          alertType: 'UNRESOLVED_DISCREPANCY',
          severity: SeverityLevel.HIGH,
          titleEn: `Spoilage / Damage Reported: ${item?.nameEn}`,
          titleGu: `બગાડ / નુકસાનની નોંધ: ${item?.nameGu}`,
          messageEn: `Write-off requested for ${data.quantity} ${data.unit} (${data.reasonCode}). Approval required.`,
          messageGu: `${data.quantity} ${data.unit} ના નુકસાનની મંજૂરી માટે વિનંતી આવી છે (${data.reasonCode}).`,
          linkRoute: '/write-off',
        },
      });

      await AuditService.log(
        {
          actorUserId: user.id,
          actorRole: user.role,
          awcId: data.awcId,
          entityType: 'WRITE_OFF',
          entityId: writeOff.id,
          action: 'CREATE',
          newValue: { caseNumber, quantity: data.quantity, reason: data.reasonCode, status: initialStatus },
          reasonCode: data.reasonCode,
        },
        tx
      );

      if (data.clientOperationId) {
        await tx.syncLog.create({
          data: {
            clientOperationId: data.clientOperationId,
            entityType: 'WRITE_OFF',
            entityId: writeOff.id,
            status: 'PROCESSED',
          },
        });
      }

      return writeOff;
    });

    return res.status(201).json({
      message: 'Spoilage report logged and submitted for approval. Stock balance remains unchanged until approval.',
      writeOff: result,
    });
  } catch (err: any) {
    console.error('Write-off creation error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/write-off — List write-offs scoped by role
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  let whereClause: any = {};

  if (user.role === Role.AWW || user.role === Role.AWH) {
    if (!user.awcId) return res.json({ writeOffs: [] });
    whereClause = { awcId: user.awcId };
  } else if (user.role === Role.SUPERVISOR) {
    if (!user.sectorId) return res.json({ writeOffs: [] });
    whereClause = { awc: { sectorId: user.sectorId } };
  } else if (user.role === Role.CDPO) {
    if (!user.blockId) return res.json({ writeOffs: [] });
    whereClause = { awc: { sector: { blockId: user.blockId } } };
  }

  const writeOffs = await prisma.writeOffRequest.findMany({
    where: whereClause,
    include: {
      item: true,
      awc: {
        include: {
          sector: { include: { block: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ writeOffs });
});

const decideWriteOffSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().min(3, 'Decision notes are required'),
});

// POST /api/write-off/:id/decide — Supervisor or CDPO decision on write-off
router.post(
  '/:id/decide',
  authenticateToken,
  requireRole(Role.SUPERVISOR, Role.CDPO, Role.DPO),
  async (req: AuthRequest, res: Response) => {
    try {
      const parse = decideWriteOffSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ error: parse.error.errors[0].message });
      }

      const { decision, notes } = parse.data;
      const user = req.user!;

      const writeOff = await prisma.writeOffRequest.findUnique({
        where: { id: req.params.id },
        include: { item: true, awc: true },
      });

      if (!writeOff) return res.status(404).json({ error: 'Write-off request not found.' });

      const isAuthorized = await verifyAwcScope(user, writeOff.awcId);
      if (!isAuthorized) {
        return res.status(403).json({ error: 'Unauthorized to decide on this request.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        let ledgerEvent = null;

        if (decision === 'APPROVE') {
          // POST APPROVED WRITE-OFF TO STOCK LEDGER!
          ledgerEvent = await LedgerService.recordMovement(
            {
              awcId: writeOff.awcId,
              itemId: writeOff.itemId,
              batchNumber: writeOff.batchNumber,
              eventType: StockEventType.APPROVED_WRITE_OFF,
              quantityChange: -writeOff.quantity, // Decrements stock!
              unit: writeOff.unit,
              referenceType: 'WRITE_OFF_APPROVAL',
              referenceId: writeOff.id,
              actorUserId: user.id,
              reasonNote: `Approved write-off (${writeOff.reasonCode}): ${notes} (Case ${writeOff.caseNumber})`,
            },
            tx
          );
        }

        const updated = await tx.writeOffRequest.update({
          where: { id: writeOff.id },
          data: {
            status: decision === 'APPROVE' ? WriteOffStatus.APPROVED : WriteOffStatus.REJECTED,
            supervisorId: user.role === Role.SUPERVISOR ? user.id : writeOff.supervisorId,
            cdpoId: user.role === Role.CDPO ? user.id : writeOff.cdpoId,
            approvalNotes: notes,
            actionTimestamp: new Date(),
          },
        });

        await AuditService.log(
          {
            actorUserId: user.id,
            actorRole: user.role,
            awcId: writeOff.awcId,
            entityType: 'WRITE_OFF',
            entityId: writeOff.id,
            action: decision,
            oldValue: { status: writeOff.status },
            newValue: { status: updated.status, notes },
            reasonCode: decision,
          },
          tx
        );

        return { updated, ledgerEvent };
      });

      return res.json({
        message: `Write-off request ${decision === 'APPROVE' ? 'approved and stock updated' : 'rejected'}.`,
        writeOff: result.updated,
        ledgerEvent: result.ledgerEvent,
      });
    } catch (err: any) {
      console.error('Write-off decision error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);

export default router;
