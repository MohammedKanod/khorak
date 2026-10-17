import { Router, Response } from 'express';
import { PhysicalCountStatus, DiscrepancyType, DiscrepancyStatus, SeverityLevel, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, verifyAwcScope } from '../middleware/auth';
import { LedgerService } from '../services/ledgerService';
import { AuditService } from '../services/auditService';

const router = Router();

const recordPhysicalCountSchema = z.object({
  awcId: z.string().uuid(),
  itemId: z.string().uuid(),
  batchNumber: z.string().optional(),
  actualPhysicalCount: z.number().nonnegative(),
  reasonCode: z.string().default('MEASUREMENT_ERROR'),
  explanation: z.string().optional(),
  clientOperationId: z.string().optional(),
});

// POST /api/physical-count — Record physical inventory count
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const parse = recordPhysicalCountSchema.safeParse(req.body);
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
          message: 'Physical count has already been processed idempotently.',
        });
      }
    }

    // Compute current authoritative book balance from ledger
    const computedBookBalance = await LedgerService.getItemBalance(data.awcId, data.itemId);
    const variance = Number((data.actualPhysicalCount - computedBookBalance).toFixed(3));
    const isMatched = Math.abs(variance) < 0.001;

    const item = await prisma.item.findUnique({ where: { id: data.itemId } });

    const result = await prisma.$transaction(async (tx) => {
      const physicalCount = await tx.physicalCount.create({
        data: {
          awcId: data.awcId,
          itemId: data.itemId,
          batchNumber: data.batchNumber,
          computedBookBalance,
          actualPhysicalCount: data.actualPhysicalCount,
          variance,
          status: isMatched ? PhysicalCountStatus.MATCHED : PhysicalCountStatus.PENDING_REVIEW,
          reasonCode: data.reasonCode,
          explanation: data.explanation,
          conductedByUserId: user.id,
          clientOperationId: data.clientOperationId,
        },
      });

      let discrepancy = null;
      if (!isMatched) {
        const count = await tx.discrepancy.count();
        const caseNumber = `DSC-2026-${String(count + 1).padStart(4, '0')}`;

        discrepancy = await tx.discrepancy.create({
          data: {
            caseNumber,
            awcId: data.awcId,
            itemId: data.itemId,
            discrepancyType: DiscrepancyType.PHYSICAL_COUNT_VARIANCE,
            relatedEntityType: 'PHYSICAL_COUNT',
            relatedEntityId: physicalCount.id,
            expectedQuantity: computedBookBalance,
            actualQuantity: data.actualPhysicalCount,
            varianceQuantity: variance,
            unit: item?.unit || 'PACKET',
            severity: Math.abs(variance) > 5 ? SeverityLevel.HIGH : SeverityLevel.MEDIUM,
            status: DiscrepancyStatus.OPEN,
            reportedByUserId: user.id,
            resolutionNotes: `Physical count variance flagged: Book ${computedBookBalance}, Physical ${data.actualPhysicalCount}, Variance ${variance}. Reason: ${data.reasonCode}. ${data.explanation || ''}`,
          },
        });

        // Notify Supervisor
        await tx.alert.create({
          data: {
            recipientRole: Role.SUPERVISOR,
            awcId: data.awcId,
            alertType: 'UNRESOLVED_DISCREPANCY',
            severity: SeverityLevel.HIGH,
            titleEn: `Stock Count Variance: ${item?.nameEn}`,
            titleGu: `સ્ટોક ગણતરીમાં તફાવત: ${item?.nameGu}`,
            messageEn: `Physical count of ${item?.nameEn} differs from book balance by ${variance} ${item?.unit}. Supervisor review required.`,
            messageGu: `${item?.nameGu} ની વાસ્તવિક ગણતરીમાં ${variance} ${item?.unit} નો તફાવત આવ્યો છે. સમીક્ષા જરૂરી છે.`,
            linkRoute: '/discrepancies',
          },
        });
      }

      await AuditService.log(
        {
          actorUserId: user.id,
          actorRole: user.role,
          awcId: data.awcId,
          entityType: 'PHYSICAL_COUNT',
          entityId: physicalCount.id,
          action: 'CREATE',
          newValue: { book: computedBookBalance, counted: data.actualPhysicalCount, variance },
          reasonCode: data.reasonCode,
        },
        tx
      );

      if (data.clientOperationId) {
        await tx.syncLog.create({
          data: {
            clientOperationId: data.clientOperationId,
            entityType: 'PHYSICAL_COUNT',
            entityId: physicalCount.id,
            status: 'PROCESSED',
          },
        });
      }

      return { physicalCount, discrepancy };
    });

    return res.status(201).json({
      message: isMatched
        ? 'Physical count matched book balance perfectly.'
        : 'Physical count variance recorded and flagged for supervisor review. Book balance remains intact.',
      ...result,
    });
  } catch (err: any) {
    console.error('Physical count error:', err);
    return res.status(400).json({ error: err.message || 'Error recording physical count' });
  }
});

// GET /api/physical-count/:awcId — Get physical counts history
router.get('/:awcId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { awcId } = req.params;
  const isAuthorized = await verifyAwcScope(req.user!, awcId);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Scope violation.' });
  }

  const counts = await prisma.physicalCount.findMany({
    where: { awcId },
    include: {
      item: true,
    },
    orderBy: { countDate: 'desc' },
  });

  return res.json({ counts });
});

export default router;
