import { Router, Response } from 'express';
import { StockEventType, UnitOfMeasure, SeverityLevel, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, verifyAwcScope } from '../middleware/auth';
import { LedgerService } from '../services/ledgerService';
import { AuditService } from '../services/auditService';

const router = Router();

const createHcmDailySchema = z.object({
  awcId: z.string().uuid(),
  serviceDate: z.string().optional(),
  enrolledChildren: z.number().int().nonnegative(),
  attendanceCount: z.number().int().nonnegative(),
  mealsPreparedCount: z.number().int().nonnegative(),
  mealsServedCount: z.number().int().nonnegative(),
  menuDescription: z.string().optional(),
  notes: z.string().optional(),
  clientOperationId: z.string().optional(),
  ingredients: z.array(
    z.object({
      itemId: z.string().uuid(),
      quantityUsed: z.number().positive('Quantity must be positive'),
      unit: z.nativeEnum(UnitOfMeasure),
    })
  ).min(1, 'At least one ingredient must be consumed'),
});

// POST /api/hcm/daily-service — Record Daily Cooking, Attendance & Ingredient Consumption
router.post('/daily-service', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const parse = createHcmDailySchema.safeParse(req.body);
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
          message: 'HCM daily service has already been processed idempotently.',
        });
      }
    }

    // Attendance crosscheck: Over-reporting flag if meals served > attendance + 5%
    const isOverReported = data.mealsServedCount > Math.ceil(data.attendanceCount * 1.05);

    const sDate = data.serviceDate ? new Date(data.serviceDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create HCM Service entry
      const service = await tx.hCMDailyService.create({
        data: {
          awcId: data.awcId,
          serviceDate: sDate,
          enrolledChildren: data.enrolledChildren,
          attendanceCount: data.attendanceCount,
          mealsPreparedCount: data.mealsPreparedCount,
          mealsServedCount: data.mealsServedCount,
          overReportFlag: isOverReported,
          menuDescription: data.menuDescription,
          recordedByUserId: user.id,
          clientOperationId: data.clientOperationId,
        },
      });

      // 2. Consume Raw Ingredients from Usable Stock Ledger
      for (const ing of data.ingredients) {
        await tx.hCMIngredientConsumption.create({
          data: {
            hcmServiceId: service.id,
            itemId: ing.itemId,
            quantityUsed: ing.quantityUsed,
            unit: ing.unit,
          },
        });

        // DECREMENT INGREDIENT FROM STOCK LEDGER!
        await LedgerService.recordMovement(
          {
            awcId: data.awcId,
            itemId: ing.itemId,
            eventType: StockEventType.HCM_CONSUMPTION,
            quantityChange: -ing.quantityUsed, // Negative
            unit: ing.unit,
            referenceType: 'HCM_SERVICE',
            referenceId: service.id,
            actorUserId: user.id,
            clientOperationId: data.clientOperationId,
            reasonNote: `HCM cooking consumption: ${ing.quantityUsed} ${ing.unit} consumed for ${data.mealsServedCount} meals`,
          },
          tx
        );
      }

      // 3. If over-reporting detected, trigger an alert to the supervisor
      if (isOverReported) {
        await tx.alert.create({
          data: {
            recipientRole: Role.SUPERVISOR,
            awcId: data.awcId,
            alertType: 'OVERREPORTED_MEALS',
            severity: SeverityLevel.MEDIUM,
            titleEn: 'Attendance vs Meal Served Discrepancy',
            titleGu: 'હાજરી કરતાં વધુ ભોજન વિતરણ નોંધાયું',
            messageEn: `Reported ${data.mealsServedCount} meals served against ${data.attendanceCount} children present (exceeds 5% tolerance).`,
            messageGu: `${data.attendanceCount} બાળકોની હાજરી સામે ${data.mealsServedCount} ભોજન પીરસાયેલ નોંધાયું છે (૫% થી વધુ તફાવત).`,
            linkRoute: '/hcm',
          },
        });
      }

      // 4. Audit Log
      await AuditService.log(
        {
          actorUserId: user.id,
          actorRole: user.role,
          awcId: data.awcId,
          entityType: 'HCM_SERVICE',
          entityId: service.id,
          action: 'CREATE',
          newValue: {
            attendance: data.attendanceCount,
            mealsServed: data.mealsServedCount,
            overReported: isOverReported,
          },
          reasonCode: 'DAILY_HCM_MEAL_SERVICE',
        },
        tx
      );

      // 5. SyncLog
      if (data.clientOperationId) {
        await tx.syncLog.create({
          data: {
            clientOperationId: data.clientOperationId,
            entityType: 'HCM_SERVICE',
            entityId: service.id,
            status: 'PROCESSED',
          },
        });
      }

      return service;
    });

    return res.status(201).json({
      message: 'Daily HCM meal service and ingredient consumption recorded successfully.',
      service: result,
      overReportFlag: isOverReported,
    });
  } catch (err: any) {
    console.error('HCM service error:', err);
    return res.status(400).json({ error: err.message || 'Error recording HCM service' });
  }
});

// GET /api/hcm/history/:awcId — History of meals served and ingredient consumption
router.get('/history/:awcId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { awcId } = req.params;
  const isAuthorized = await verifyAwcScope(req.user!, awcId);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Scope violation.' });
  }

  const history = await prisma.hCMDailyService.findMany({
    where: { awcId },
    include: {
      consumptions: {
        include: { item: true },
      },
      recordedByUser: { select: { fullNameEn: true, fullNameGu: true } },
    },
    orderBy: { serviceDate: 'desc' },
    take: 30,
  });

  return res.json({ history });
});

export default router;
