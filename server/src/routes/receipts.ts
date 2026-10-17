import { Router, Response } from 'express';
import { Role, DispatchStatus, ReceiptStatus, StockEventType, DiscrepancyType, DiscrepancyStatus, SeverityLevel, UnitOfMeasure } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, verifyAwcScope } from '../middleware/auth';
import { LedgerService } from '../services/ledgerService';
import { AuditService } from '../services/auditService';

const router = Router();

const verifyReceiptSchema = z.object({
  dispatchId: z.string().uuid().optional(),
  awcId: z.string().uuid(),
  challanNumber: z.string().min(1, 'Challan number is required'),
  supervisorOtpVerified: z.boolean().default(false),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
  clientOperationId: z.string().optional(),
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      batchNumber: z.string().optional(),
      quantityExpected: z.number().nonnegative(),
      quantityAccepted: z.number().nonnegative(),
      quantityDamaged: z.number().nonnegative().default(0),
      quantityRejected: z.number().nonnegative().default(0),
      quantityShort: z.number().nonnegative().default(0),
      unit: z.nativeEnum(UnitOfMeasure),
      conditionStatus: z.string().default('GOOD'),
      notes: z.string().optional(),
    })
  ).min(1, 'At least one item must be verified'),
});

// POST /api/receipts/verify — AWC Delivery Receipt Verification Workflow
router.post('/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const parse = verifyReceiptSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const data = parse.data;
    const user = req.user!;

    // Scope check: AWW can only receive for their own AWC
    const isAuthorized = await verifyAwcScope(user, data.awcId);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Scope violation: You can only record receipts for your assigned AWC.' });
    }

    // Idempotency check: if clientOperationId exists, prevent duplicate processing
    if (data.clientOperationId) {
      const existingSync = await prisma.syncLog.findUnique({
        where: { clientOperationId: data.clientOperationId },
      });
      if (existingSync) {
        return res.status(200).json({
          status: 'DUPLICATE_IGNORED',
          message: 'Operation has already been processed idempotently.',
          entityId: existingSync.entityId,
        });
      }
    }

    const count = await prisma.receipt.count();
    const receiptNumber = `RCP-2026-${String(count + 1).padStart(4, '0')}`;

    let hasDiscrepancy = false;
    for (const item of data.items) {
      if (item.quantityShort > 0 || item.quantityDamaged > 0 || item.quantityRejected > 0) {
        hasDiscrepancy = true;
        break;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Receipt record
      const receipt = await tx.receipt.create({
        data: {
          receiptNumber,
          dispatchId: data.dispatchId,
          awcId: data.awcId,
          challanNumber: data.challanNumber,
          receivedDate: new Date(),
          receivedByUserId: user.id,
          supervisorOtpVerified: data.supervisorOtpVerified,
          photoUrl: data.photoUrl,
          status: hasDiscrepancy ? ReceiptStatus.HAS_DISCREPANCIES : ReceiptStatus.CONFIRMED,
          notes: data.notes,
          clientOperationId: data.clientOperationId,
        },
      });

      // 2. Process Line Items and Ledger Events
      const discrepanciesCreated = [];

      for (const it of data.items) {
        await tx.receiptItem.create({
          data: {
            receiptId: receipt.id,
            itemId: it.itemId,
            batchNumber: it.batchNumber,
            quantityExpected: it.quantityExpected,
            quantityAccepted: it.quantityAccepted,
            quantityDamaged: it.quantityDamaged,
            quantityRejected: it.quantityRejected,
            quantityShort: it.quantityShort,
            unit: it.unit,
            conditionStatus: it.conditionStatus,
            notes: it.notes,
          },
        });

        // ONLY quantityAccepted ENTERS THE USABLE STOCK LEDGER!
        if (it.quantityAccepted > 0) {
          await LedgerService.recordMovement(
            {
              awcId: data.awcId,
              itemId: it.itemId,
              batchNumber: it.batchNumber,
              eventType: StockEventType.RECEIPT_INTAKE,
              quantityChange: it.quantityAccepted,
              unit: it.unit,
              referenceType: 'RECEIPT',
              referenceId: receipt.id,
              actorUserId: user.id,
              clientOperationId: data.clientOperationId,
              reasonNote: `Verified delivery intake: ${it.quantityAccepted} ${it.unit} accepted (Challan ${data.challanNumber})`,
            },
            tx
          );
        }

        // If there is short quantity, create a SHORT_DELIVERY Discrepancy
        if (it.quantityShort > 0) {
          const dscCount = await tx.discrepancy.count();
          const caseNumber = `DSC-2026-${String(dscCount + 1).padStart(4, '0')}`;

          const disc = await tx.discrepancy.create({
            data: {
              caseNumber,
              awcId: data.awcId,
              itemId: it.itemId,
              discrepancyType: DiscrepancyType.SHORT_DELIVERY,
              relatedEntityType: 'RECEIPT',
              relatedEntityId: receipt.id,
              expectedQuantity: it.quantityExpected,
              actualQuantity: it.quantityAccepted,
              varianceQuantity: -it.quantityShort,
              unit: it.unit,
              severity: it.quantityShort / (it.quantityExpected || 1) >= 0.2 ? SeverityLevel.CRITICAL : SeverityLevel.HIGH,
              status: DiscrepancyStatus.OPEN,
              reportedByUserId: user.id,
              evidencePhotoUrl: data.photoUrl,
              resolutionNotes: `Short delivery reported on Challan ${data.challanNumber}. Expected: ${it.quantityExpected}, Accepted: ${it.quantityAccepted}, Shortage: ${it.quantityShort}`,
            },
          });

          discrepanciesCreated.push(disc);

          // Alert Supervisor immediately
          await tx.alert.create({
            data: {
              recipientRole: Role.SUPERVISOR,
              awcId: data.awcId,
              alertType: 'SHORT_DELIVERY',
              severity: SeverityLevel.HIGH,
              titleEn: `Short Delivery Flagged (${it.quantityShort} ${it.unit} short)`,
              titleGu: `ઓછો પુરવઠો નોંધાયો (${it.quantityShort} ${it.unit} ઘટ)`,
              messageEn: `Receipt on Challan ${data.challanNumber} has a shortage of ${it.quantityShort} ${it.unit}. Review required.`,
              messageGu: `ચલણ ${data.challanNumber} માં ${it.quantityShort} ${it.unit} ની ઘટ મળી છે. કૃપા કરીને તપાસ કરો.`,
              linkRoute: '/discrepancies',
            },
          });
        }

        // If there is damaged quantity, create a DAMAGED_DELIVERY Discrepancy
        if (it.quantityDamaged > 0) {
          const dscCount = await tx.discrepancy.count();
          const caseNumber = `DSC-2026-${String(dscCount + 1).padStart(4, '0')}`;

          const disc = await tx.discrepancy.create({
            data: {
              caseNumber,
              awcId: data.awcId,
              itemId: it.itemId,
              discrepancyType: DiscrepancyType.DAMAGED_DELIVERY,
              relatedEntityType: 'RECEIPT',
              relatedEntityId: receipt.id,
              expectedQuantity: it.quantityExpected,
              actualQuantity: it.quantityAccepted,
              varianceQuantity: -it.quantityDamaged,
              unit: it.unit,
              severity: SeverityLevel.HIGH,
              status: DiscrepancyStatus.OPEN,
              reportedByUserId: user.id,
              evidencePhotoUrl: data.photoUrl,
              resolutionNotes: `Damaged stock on arrival on Challan ${data.challanNumber}: ${it.quantityDamaged} ${it.unit}. Stock isolated.`,
            },
          });

          discrepanciesCreated.push(disc);
        }
      }

      // 3. Update parent Dispatch status if linked
      if (data.dispatchId) {
        await tx.dispatch.update({
          where: { id: data.dispatchId },
          data: {
            status: hasDiscrepancy ? DispatchStatus.PARTIALLY_RECEIVED : DispatchStatus.RECEIVED,
          },
        });
      }

      // 4. Record in Audit Log
      await AuditService.log(
        {
          actorUserId: user.id,
          actorRole: user.role,
          awcId: data.awcId,
          entityType: 'RECEIPT',
          entityId: receipt.id,
          action: 'CREATE',
          newValue: {
            receiptNumber,
            challanNumber: data.challanNumber,
            items: data.items,
            hasDiscrepancy,
          },
          reasonCode: 'AWC_DELIVERY_VERIFIED',
        },
        tx
      );

      // 5. Record SyncLog if clientOperationId provided
      if (data.clientOperationId) {
        await tx.syncLog.create({
          data: {
            clientOperationId: data.clientOperationId,
            entityType: 'RECEIPT',
            entityId: receipt.id,
            status: 'PROCESSED',
          },
        });
      }

      return { receipt, discrepanciesCreated };
    });

    return res.status(201).json(result);
  } catch (err: any) {
    console.error('Receipt verification error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/receipts/awc/:awcId — Get receipt history for an AWC
router.get('/awc/:awcId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { awcId } = req.params;
  const isAuthorized = await verifyAwcScope(req.user!, awcId);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Scope violation: Unauthorized to access receipts for this AWC.' });
  }

  const receipts = await prisma.receipt.findMany({
    where: { awcId },
    include: {
      items: { include: { item: true } },
      receivedByUser: { select: { fullNameEn: true, fullNameGu: true } },
      dispatch: { select: { dispatchNumber: true, supplier: { select: { nameEn: true, nameGu: true } } } },
    },
    orderBy: { receivedDate: 'desc' },
  });

  return res.json({ receipts });
});

export default router;
