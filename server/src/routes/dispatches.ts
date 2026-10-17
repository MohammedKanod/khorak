import { Router, Response } from 'express';
import { Role, DispatchStatus, UnitOfMeasure, SeverityLevel } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = Router();

const createDispatchSchema = z.object({
  challanNumber: z.string().min(3, 'Challan number is required'),
  destinationAwcId: z.string().uuid('Valid AWC is required'),
  supplierId: z.string().uuid().optional(),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      batchNumber: z.string().optional(),
      quantityDispatched: z.number().positive('Quantity must be greater than zero'),
      unit: z.nativeEnum(UnitOfMeasure),
    })
  ).min(1, 'At least one item is required in the dispatch'),
});

// GET /api/dispatches — List dispatches scoped by role
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  let whereClause: any = {};

  if (user.role === Role.SUPPLIER) {
    if (!user.supplierId) return res.json({ dispatches: [] });
    whereClause.supplierId = user.supplierId;
  } else if (user.role === Role.AWW || user.role === Role.AWH) {
    if (!user.awcId) return res.json({ dispatches: [] });
    whereClause.destinationAwcId = user.awcId;
  } else if (user.role === Role.SUPERVISOR) {
    if (!user.sectorId) return res.json({ dispatches: [] });
    whereClause.destinationAwc = { sectorId: user.sectorId };
  } else if (user.role === Role.CDPO) {
    if (!user.blockId) return res.json({ dispatches: [] });
    whereClause.destinationAwc = { sector: { blockId: user.blockId } };
  }

  const dispatches = await prisma.dispatch.findMany({
    where: whereClause,
    include: {
      supplier: true,
      destinationAwc: {
        include: { sector: true },
      },
      items: {
        include: { item: true },
      },
      receipt: true,
    },
    orderBy: { dispatchDate: 'desc' },
  });

  return res.json({ dispatches });
});

// GET /api/dispatches/:id — Get dispatch details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const dispatch = await prisma.dispatch.findUnique({
    where: { id: req.params.id },
    include: {
      supplier: true,
      destinationAwc: {
        include: { sector: { include: { block: true } } },
      },
      items: {
        include: { item: true, batch: true },
      },
      receipt: {
        include: {
          items: { include: { item: true } },
          receivedByUser: { select: { fullNameEn: true, fullNameGu: true } },
        },
      },
    },
  });

  if (!dispatch) return res.status(404).json({ error: 'Dispatch not found.' });

  return res.json({ dispatch });
});

// POST /api/dispatches — Create new dispatch (Supplier or CDPO only)
router.post(
  '/',
  authenticateToken,
  requireRole(Role.SUPPLIER, Role.CDPO),
  async (req: AuthRequest, res: Response) => {
    try {
      const parse = createDispatchSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ error: parse.error.errors[0].message });
      }

      const data = parse.data;
      const user = req.user!;

      const supplierId = user.role === Role.SUPPLIER ? user.supplierId! : data.supplierId;
      if (!supplierId) {
        return res.status(400).json({ error: 'Valid supplier must be associated with dispatch.' });
      }

      // Check duplicate challan
      const existing = await prisma.dispatch.findUnique({
        where: { challanNumber: data.challanNumber },
      });
      if (existing) {
        return res.status(409).json({
          error: `Delivery challan ${data.challanNumber} has already been registered in the system.`,
        });
      }

      const count = await prisma.dispatch.count();
      const dispatchNumber = `DSP-2026-${String(count + 1).padStart(4, '0')}`;

      const dispatch = await prisma.$transaction(async (tx) => {
        const created = await tx.dispatch.create({
          data: {
            dispatchNumber,
            challanNumber: data.challanNumber,
            supplierId,
            destinationAwcId: data.destinationAwcId,
            vehicleNumber: data.vehicleNumber,
            driverName: data.driverName,
            driverPhone: data.driverPhone,
            notes: data.notes,
            status: DispatchStatus.DISPATCHED,
            dispatchDate: new Date(),
          },
        });

        for (const it of data.items) {
          await tx.dispatchItem.create({
            data: {
              dispatchId: created.id,
              itemId: it.itemId,
              batchNumber: it.batchNumber,
              quantityDispatched: it.quantityDispatched,
              unit: it.unit,
            },
          });
        }

        // Notify destination AWC
        await tx.alert.create({
          data: {
            recipientRole: Role.AWW,
            awcId: data.destinationAwcId,
            alertType: 'NEW_DELIVERY_INCOMING',
            severity: SeverityLevel.MEDIUM,
            titleEn: 'New Delivery Dispatched',
            titleGu: 'નવો પુરવઠો ડિસ્પેચ થયો છે',
            messageEn: `Challan ${data.challanNumber} has been dispatched. Please prepare to receive.`,
            messageGu: `ચલણ ${data.challanNumber} રવાના થયેલ છે. આંગણવાડી પર પહોંચ્યા પછી ચકાસણી કરો.`,
            linkRoute: '/dispatches',
          },
        });

        await AuditService.log(
          {
            actorUserId: user.id,
            actorRole: user.role,
            awcId: data.destinationAwcId,
            entityType: 'DISPATCH',
            entityId: created.id,
            action: 'CREATE',
            newValue: { dispatchNumber, challanNumber: data.challanNumber, items: data.items },
            reasonCode: 'SUPPLIER_DISPATCH_LOGGED',
          },
          tx
        );

        return created;
      });

      return res.status(201).json({ dispatch });
    } catch (err: any) {
      console.error('Dispatch creation error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);

export default router;
