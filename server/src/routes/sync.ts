import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, verifyAwcScope } from '../middleware/auth';
import { LedgerService } from '../services/ledgerService';
import { AuditService } from '../services/auditService';
import { StockEventType, DiscrepancyType, DiscrepancyStatus, SeverityLevel, WriteOffStatus, PhysicalCountStatus, ReceiptStatus, UnitOfMeasure } from '@prisma/client';

const router = Router();

const syncBatchSchema = z.object({
  operations: z.array(
    z.object({
      operationId: z.string().uuid(),
      type: z.enum(['RECEIPT_VERIFY', 'THR_DISTRIBUTE', 'HCM_SERVICE', 'PHYSICAL_COUNT', 'WRITE_OFF']),
      payload: z.any(),
      clientCreatedAt: z.string().optional(),
    })
  ).min(1, 'No operations provided in sync batch'),
});

// POST /api/sync/batch — Atomic, idempotent sync engine for offline outbox flushes
router.post('/batch', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const parse = syncBatchSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { operations } = parse.data;
    const user = req.user!;
    const results = [];

    for (const op of operations) {
      // 1. Idempotency Check
      const existingSync = await prisma.syncLog.findUnique({
        where: { clientOperationId: op.operationId },
      });

      if (existingSync) {
        results.push({
          operationId: op.operationId,
          status: 'DUPLICATE_IGNORED',
          message: 'Operation was already synchronized previously.',
        });
        continue;
      }

      // 2. Process Operation by Type
      try {
        let processedEntityId: string | undefined;

        if (op.type === 'RECEIPT_VERIFY') {
          const data = op.payload;
          const isAuthorized = await verifyAwcScope(user, data.awcId);
          if (!isAuthorized) throw new Error('Scope violation on receipt sync');

          const count = await prisma.receipt.count();
          const receiptNumber = `RCP-2026-${String(count + 1).padStart(4, '0')}`;

          await prisma.$transaction(async (tx) => {
            const receipt = await tx.receipt.create({
              data: {
                receiptNumber,
                dispatchId: data.dispatchId,
                awcId: data.awcId,
                challanNumber: data.challanNumber,
                receivedDate: op.clientCreatedAt ? new Date(op.clientCreatedAt) : new Date(),
                receivedByUserId: user.id,
                supervisorOtpVerified: !!data.supervisorOtpVerified,
                photoUrl: data.photoUrl,
                status: (data.items.some((i: any) => i.quantityShort > 0 || i.quantityDamaged > 0))
                  ? ReceiptStatus.HAS_DISCREPANCIES
                  : ReceiptStatus.CONFIRMED,
                notes: data.notes,
                clientOperationId: op.operationId,
              },
            });
            processedEntityId = receipt.id;

            for (const it of data.items) {
              await tx.receiptItem.create({
                data: {
                  receiptId: receipt.id,
                  itemId: it.itemId,
                  batchNumber: it.batchNumber,
                  quantityExpected: it.quantityExpected,
                  quantityAccepted: it.quantityAccepted,
                  quantityDamaged: it.quantityDamaged || 0,
                  quantityRejected: it.quantityRejected || 0,
                  quantityShort: it.quantityShort || 0,
                  unit: it.unit,
                  conditionStatus: it.conditionStatus || 'GOOD',
                  notes: it.notes,
                },
              });

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
                    clientOperationId: op.operationId,
                    clientCreatedAt: op.clientCreatedAt ? new Date(op.clientCreatedAt) : null,
                    reasonNote: `Offline Sync Delivery Intake: ${it.quantityAccepted} ${it.unit} (Challan ${data.challanNumber})`,
                  },
                  tx
                );
              }

              if (it.quantityShort > 0) {
                const dscCount = await tx.discrepancy.count();
                await tx.discrepancy.create({
                  data: {
                    caseNumber: `DSC-2026-${String(dscCount + 1).padStart(4, '0')}`,
                    awcId: data.awcId,
                    itemId: it.itemId,
                    discrepancyType: DiscrepancyType.SHORT_DELIVERY,
                    relatedEntityType: 'RECEIPT',
                    relatedEntityId: receipt.id,
                    expectedQuantity: it.quantityExpected,
                    actualQuantity: it.quantityAccepted,
                    varianceQuantity: -it.quantityShort,
                    unit: it.unit,
                    severity: SeverityLevel.HIGH,
                    status: DiscrepancyStatus.OPEN,
                    reportedByUserId: user.id,
                  },
                });
              }
            }
          });
        } else if (op.type === 'THR_DISTRIBUTE') {
          const data = op.payload;
          const isAuthorized = await verifyAwcScope(user, data.awcId);
          if (!isAuthorized) throw new Error('Scope violation on THR sync');

          await prisma.$transaction(async (tx) => {
            for (const dist of data.distributions) {
              const rec = await tx.tHRDistribution.create({
                data: {
                  awcId: data.awcId,
                  distributionDate: op.clientCreatedAt ? new Date(op.clientCreatedAt) : new Date(),
                  distributionCycle: data.distributionCycle || 'OCT-2026',
                  beneficiaryId: dist.beneficiaryId,
                  beneficiaryCategory: dist.beneficiaryCategory,
                  itemId: dist.itemId,
                  quantityDistributed: dist.quantityDistributed,
                  unit: UnitOfMeasure.PACKET,
                  acknowledgmentType: dist.acknowledgmentType || 'SCREEN_SIGNATURE',
                  signatureData: dist.signatureData,
                  photoUrl: dist.photoUrl,
                  recordedByUserId: user.id,
                  clientOperationId: op.operationId,
                  isOfflineSync: true,
                },
              });
              processedEntityId = rec.id;

              await LedgerService.recordMovement(
                {
                  awcId: data.awcId,
                  itemId: dist.itemId,
                  eventType: StockEventType.THR_DISTRIBUTION,
                  quantityChange: -dist.quantityDistributed,
                  unit: UnitOfMeasure.PACKET,
                  referenceType: 'THR_DISTRIBUTION',
                  referenceId: rec.id,
                  actorUserId: user.id,
                  clientOperationId: op.operationId,
                  clientCreatedAt: op.clientCreatedAt ? new Date(op.clientCreatedAt) : null,
                  reasonNote: `Offline Sync THR: ${dist.quantityDistributed} packets distributed`,
                },
                tx
              );
            }
          });
        } else if (op.type === 'HCM_SERVICE') {
          const data = op.payload;
          const isAuthorized = await verifyAwcScope(user, data.awcId);
          if (!isAuthorized) throw new Error('Scope violation on HCM sync');

          const isOverReported = data.mealsServedCount > Math.ceil(data.attendanceCount * 1.05);

          await prisma.$transaction(async (tx) => {
            const service = await tx.hCMDailyService.create({
              data: {
                awcId: data.awcId,
                serviceDate: op.clientCreatedAt ? new Date(op.clientCreatedAt) : new Date(),
                enrolledChildren: data.enrolledChildren,
                attendanceCount: data.attendanceCount,
                mealsPreparedCount: data.mealsPreparedCount,
                mealsServedCount: data.mealsServedCount,
                overReportFlag: isOverReported,
                menuDescription: data.menuDescription,
                recordedByUserId: user.id,
                clientOperationId: op.operationId,
              },
            });
            processedEntityId = service.id;

            for (const ing of data.ingredients) {
              await tx.hCMIngredientConsumption.create({
                data: {
                  hcmServiceId: service.id,
                  itemId: ing.itemId,
                  quantityUsed: ing.quantityUsed,
                  unit: ing.unit,
                },
              });

              await LedgerService.recordMovement(
                {
                  awcId: data.awcId,
                  itemId: ing.itemId,
                  eventType: StockEventType.HCM_CONSUMPTION,
                  quantityChange: -ing.quantityUsed,
                  unit: ing.unit,
                  referenceType: 'HCM_SERVICE',
                  referenceId: service.id,
                  actorUserId: user.id,
                  clientOperationId: op.operationId,
                  clientCreatedAt: op.clientCreatedAt ? new Date(op.clientCreatedAt) : null,
                  reasonNote: `Offline Sync HCM: ${ing.quantityUsed} ${ing.unit} consumed`,
                },
                tx
              );
            }
          });
        } else if (op.type === 'PHYSICAL_COUNT') {
          const data = op.payload;
          const isAuthorized = await verifyAwcScope(user, data.awcId);
          if (!isAuthorized) throw new Error('Scope violation on count sync');

          const computedBookBalance = await LedgerService.getItemBalance(data.awcId, data.itemId);
          const variance = Number((data.actualPhysicalCount - computedBookBalance).toFixed(3));
          const isMatched = Math.abs(variance) < 0.001;

          await prisma.$transaction(async (tx) => {
            const pc = await tx.physicalCount.create({
              data: {
                awcId: data.awcId,
                itemId: data.itemId,
                batchNumber: data.batchNumber,
                computedBookBalance,
                actualPhysicalCount: data.actualPhysicalCount,
                variance,
                status: isMatched ? PhysicalCountStatus.MATCHED : PhysicalCountStatus.PENDING_REVIEW,
                reasonCode: data.reasonCode || 'MEASUREMENT_ERROR',
                explanation: data.explanation,
                conductedByUserId: user.id,
                clientOperationId: op.operationId,
              },
            });
            processedEntityId = pc.id;

            if (!isMatched) {
              const dscCount = await tx.discrepancy.count();
              await tx.discrepancy.create({
                data: {
                  caseNumber: `DSC-2026-${String(dscCount + 1).padStart(4, '0')}`,
                  awcId: data.awcId,
                  itemId: data.itemId,
                  discrepancyType: DiscrepancyType.PHYSICAL_COUNT_VARIANCE,
                  relatedEntityType: 'PHYSICAL_COUNT',
                  relatedEntityId: pc.id,
                  expectedQuantity: computedBookBalance,
                  actualQuantity: data.actualPhysicalCount,
                  varianceQuantity: variance,
                  unit: data.unit || 'PACKET',
                  status: DiscrepancyStatus.OPEN,
                  reportedByUserId: user.id,
                },
              });
            }
          });
        } else if (op.type === 'WRITE_OFF') {
          const data = op.payload;
          const isAuthorized = await verifyAwcScope(user, data.awcId);
          if (!isAuthorized) throw new Error('Scope violation on write-off sync');

          const count = await prisma.writeOffRequest.count();
          const caseNumber = `WRO-2026-${String(count + 1).padStart(4, '0')}`;

          const isHighQuantity = data.quantity >= 5;
          const initialStatus = isHighQuantity
            ? WriteOffStatus.PENDING_CDPO
            : WriteOffStatus.PENDING_SUPERVISOR;

          const wr = await prisma.writeOffRequest.create({
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
              clientOperationId: op.operationId,
            },
          });
          processedEntityId = wr.id;
        }

        // Record in SyncLog
        await prisma.syncLog.create({
          data: {
            clientOperationId: op.operationId,
            entityType: op.type,
            entityId: processedEntityId,
            status: 'PROCESSED',
          },
        });

        results.push({
          operationId: op.operationId,
          status: 'PROCESSED',
          entityId: processedEntityId,
        });
      } catch (err: any) {
        console.error(`Sync error on operation ${op.operationId}:`, err);
        results.push({
          operationId: op.operationId,
          status: 'CONFLICT_FLAGGED',
          error: err.message || 'Operation failed server validation',
        });
      }
    }

    const processedCount = results.filter((r) => r.status === 'PROCESSED').length;
    const duplicateCount = results.filter((r) => r.status === 'DUPLICATE_IGNORED').length;
    const conflictCount = results.filter((r) => r.status === 'CONFLICT_FLAGGED').length;

    return res.json({
      summary: {
        total: operations.length,
        processedCount,
        duplicateCount,
        conflictCount,
      },
      results,
    });
  } catch (err: any) {
    console.error('Batch sync endpoint error:', err);
    return res.status(500).json({ error: err.message || 'Batch sync failed' });
  }
});

export default router;
