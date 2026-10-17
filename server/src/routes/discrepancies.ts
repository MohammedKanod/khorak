import { Router, Response } from 'express';
import { Role, DiscrepancyStatus, PhysicalCountStatus, StockEventType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, requireRole, verifyAwcScope } from '../middleware/auth';
import { LedgerService } from '../services/ledgerService';
import { AuditService } from '../services/auditService';

const router = Router();

// GET /api/discrepancies — List discrepancies scoped by user role
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  let whereClause: any = {};

  if (user.role === Role.AWW || user.role === Role.AWH) {
    if (!user.awcId) return res.json({ discrepancies: [] });
    whereClause = { awcId: user.awcId };
  } else if (user.role === Role.SUPERVISOR) {
    if (!user.sectorId) return res.json({ discrepancies: [] });
    whereClause = { awc: { sectorId: user.sectorId } };
  } else if (user.role === Role.CDPO) {
    if (!user.blockId) return res.json({ discrepancies: [] });
    whereClause = { awc: { sector: { blockId: user.blockId } } };
  }

  const { status } = req.query;
  if (status && typeof status === 'string') {
    whereClause.status = status as DiscrepancyStatus;
  }

  const discrepancies = await prisma.discrepancy.findMany({
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

  return res.json({ discrepancies });
});

// GET /api/discrepancies/:id — Single discrepancy details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const discrepancy = await prisma.discrepancy.findUnique({
    where: { id: req.params.id },
    include: {
      item: true,
      awc: {
        include: { sector: { include: { block: true } } },
      },
    },
  });

  if (!discrepancy) return res.status(404).json({ error: 'Discrepancy not found.' });

  const isAuthorized = await verifyAwcScope(req.user!, discrepancy.awcId);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized to view this discrepancy.' });
  }

  return res.json({ discrepancy });
});

const discrepancyActionSchema = z.object({
  action: z.enum(['APPROVE_ADJUSTMENT', 'REQUEST_RECOUNT', 'REJECT', 'RESOLVE_NOTE']),
  notes: z.string().min(3, 'Action explanation/notes are required'),
});

// POST /api/discrepancies/:id/action — Supervisor or CDPO Resolution Action
router.post(
  '/:id/action',
  authenticateToken,
  requireRole(Role.SUPERVISOR, Role.CDPO, Role.DPO),
  async (req: AuthRequest, res: Response) => {
    try {
      const parse = discrepancyActionSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ error: parse.error.errors[0].message });
      }

      const { action, notes } = parse.data;
      const user = req.user!;

      const discrepancy = await prisma.discrepancy.findUnique({
        where: { id: req.params.id },
        include: { item: true, awc: true },
      });

      if (!discrepancy) return res.status(404).json({ error: 'Discrepancy not found.' });

      const isAuthorized = await verifyAwcScope(user, discrepancy.awcId);
      if (!isAuthorized) {
        return res.status(403).json({ error: 'Unauthorized: AWC outside your oversight jurisdiction.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        let newStatus: DiscrepancyStatus = DiscrepancyStatus.INVESTIGATING;
        let ledgerEvent = null;

        if (action === 'APPROVE_ADJUSTMENT') {
          newStatus = DiscrepancyStatus.APPROVED_ADJUSTED;

          // If linked to a Physical Count, post an explicit adjustment to the stock ledger!
          if (discrepancy.relatedEntityType === 'PHYSICAL_COUNT') {
            await tx.physicalCount.update({
              where: { id: discrepancy.relatedEntityId },
              data: {
                status: PhysicalCountStatus.APPROVED,
                reviewedByUserId: user.id,
                reviewTimestamp: new Date(),
                reviewNotes: notes,
              },
            });

            // Adjust stock ledger by the variance quantity
            ledgerEvent = await LedgerService.recordMovement(
              {
                awcId: discrepancy.awcId,
                itemId: discrepancy.itemId,
                eventType: StockEventType.PHYSICAL_COUNT_ADJUSTMENT,
                quantityChange: discrepancy.varianceQuantity, // Adjust by variance
                unit: discrepancy.unit,
                referenceType: 'DISCREPANCY_APPROVAL',
                referenceId: discrepancy.id,
                actorUserId: user.id,
                reasonNote: `Supervisor Approved Adjustment: ${notes} (Case ${discrepancy.caseNumber})`,
                allowNegative: true, // Specific supervisor authorized adjustment
              },
              tx
            );
          }
        } else if (action === 'REQUEST_RECOUNT') {
          newStatus = DiscrepancyStatus.RECOUNT_REQUESTED;

          if (discrepancy.relatedEntityType === 'PHYSICAL_COUNT') {
            await tx.physicalCount.update({
              where: { id: discrepancy.relatedEntityId },
              data: {
                status: PhysicalCountStatus.RECOUNT_REQUESTED,
                reviewedByUserId: user.id,
                reviewTimestamp: new Date(),
                reviewNotes: notes,
              },
            });
          }

          // Alert AWW
          await tx.alert.create({
            data: {
              recipientRole: Role.AWW,
              awcId: discrepancy.awcId,
              alertType: 'UNRESOLVED_DISCREPANCY',
              titleEn: `Recount Requested: ${discrepancy.item.nameEn}`,
              titleGu: `ફરીથી ગણતરી કરવા વિનંતી: ${discrepancy.item.nameGu}`,
              messageEn: `Supervisor requested recount for case ${discrepancy.caseNumber}: ${notes}`,
              messageGu: `મુખ્ય સેવિકા દ્વારા કેસ ${discrepancy.caseNumber} માટે ફરી ગણતરી કરવા જણાવાયું છે.`,
              linkRoute: '/physical-count',
            },
          });
        } else if (action === 'REJECT') {
          newStatus = DiscrepancyStatus.REJECTED;

          if (discrepancy.relatedEntityType === 'PHYSICAL_COUNT') {
            await tx.physicalCount.update({
              where: { id: discrepancy.relatedEntityId },
              data: {
                status: PhysicalCountStatus.REJECTED,
                reviewedByUserId: user.id,
                reviewTimestamp: new Date(),
                reviewNotes: notes,
              },
            });
          }
        } else if (action === 'RESOLVE_NOTE') {
          newStatus = DiscrepancyStatus.RESOLVED;
        }

        const updated = await tx.discrepancy.update({
          where: { id: discrepancy.id },
          data: {
            status: newStatus,
            reviewedByUserId: user.id,
            resolutionTimestamp: new Date(),
            resolutionNotes: notes,
          },
        });

        await AuditService.log(
          {
            actorUserId: user.id,
            actorRole: user.role,
            awcId: discrepancy.awcId,
            entityType: 'DISCREPANCY',
            entityId: discrepancy.id,
            action: action,
            oldValue: { status: discrepancy.status },
            newValue: { status: newStatus, notes },
            reasonCode: action,
          },
          tx
        );

        return { updated, ledgerEvent };
      });

      return res.json({
        message: `Discrepancy successfully updated with action: ${action}`,
        discrepancy: result.updated,
        ledgerEvent: result.ledgerEvent,
      });
    } catch (err: any) {
      console.error('Discrepancy action error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);

export default router;
