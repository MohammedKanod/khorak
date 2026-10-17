import { Router, Response } from 'express';
import { BeneficiaryCategory, StockEventType, UnitOfMeasure } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, verifyAwcScope } from '../middleware/auth';
import { LedgerService } from '../services/ledgerService';
import { AuditService } from '../services/auditService';

const router = Router();

// GET /api/thr/beneficiaries/:awcId — List beneficiaries for AWC
router.get('/beneficiaries/:awcId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { awcId } = req.params;
  const isAuthorized = await verifyAwcScope(req.user!, awcId);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Scope violation: Unauthorized to view beneficiaries for this AWC.' });
  }

  const beneficiaries = await prisma.beneficiary.findMany({
    where: { awcId, active: true },
    orderBy: [{ category: 'asc' }, { fullNameEn: 'asc' }],
  });

  return res.json({ beneficiaries });
});

// POST /api/thr/beneficiaries — Register new beneficiary (Data minimization: SHA-256 hashed ID only)
const createBeneficiarySchema = z.object({
  awcId: z.string().uuid(),
  fullNameEn: z.string().min(2, 'Name is required'),
  fullNameGu: z.string().min(2, 'Name in Gujarati is required'),
  category: z.nativeEnum(BeneficiaryCategory),
  guardianName: z.string().optional(),
  dateOfBirth: z.string(), // ISO date
  gender: z.string().default('FEMALE'),
  aadhaarRaw: z.string().optional(), // We immediately hash this and DO NOT store raw
});

router.post('/beneficiaries', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const parse = createBeneficiarySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const data = parse.data;
    const isAuthorized = await verifyAwcScope(req.user!, data.awcId);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Scope violation: Unauthorized.' });
    }

    const hashedAadhaar = data.aadhaarRaw
      ? crypto.createHash('sha256').update(data.aadhaarRaw).digest('hex')
      : `synth_id_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const beneficiary = await prisma.beneficiary.create({
      data: {
        awcId: data.awcId,
        hashedAadhaar,
        fullNameEn: data.fullNameEn,
        fullNameGu: data.fullNameGu,
        category: data.category,
        guardianName: data.guardianName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
      },
    });

    // Update total enrolled beneficiaries count on AWC
    await prisma.aWC.update({
      where: { id: data.awcId },
      data: { enrolledBeneficiariesCount: { increment: 1 } },
    });

    return res.status(201).json({ beneficiary });
  } catch (err: any) {
    console.error('Create beneficiary error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/thr/distribute — Record THR Distribution (Single or Batch Roster)
const distributeThrSchema = z.object({
  awcId: z.string().uuid(),
  distributionCycle: z.string().default('OCT-2026'),
  distributionDate: z.string().optional(),
  distributions: z.array(
    z.object({
      beneficiaryId: z.string().uuid().optional(),
      beneficiaryCategory: z.nativeEnum(BeneficiaryCategory),
      itemId: z.string().uuid(),
      batchNumber: z.string().optional(),
      quantityDistributed: z.number().positive('Quantity must be greater than zero'),
      acknowledgmentType: z.string().default('SCREEN_SIGNATURE'),
      signatureData: z.string().optional(),
      photoUrl: z.string().optional(),
    })
  ).min(1, 'At least one distribution entry is required'),
  clientOperationId: z.string().optional(),
});

router.post('/distribute', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const parse = distributeThrSchema.safeParse(req.body);
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
          message: 'THR distribution has already been processed idempotently.',
        });
      }
    }

    const distDate = data.distributionDate ? new Date(data.distributionDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const createdRecords = [];

      for (const dist of data.distributions) {
        const record = await tx.tHRDistribution.create({
          data: {
            awcId: data.awcId,
            distributionDate: distDate,
            distributionCycle: data.distributionCycle,
            beneficiaryId: dist.beneficiaryId,
            beneficiaryCategory: dist.beneficiaryCategory,
            itemId: dist.itemId,
            batchNumber: dist.batchNumber,
            quantityDistributed: dist.quantityDistributed,
            unit: UnitOfMeasure.PACKET,
            acknowledgmentType: dist.acknowledgmentType,
            signatureData: dist.signatureData,
            photoUrl: dist.photoUrl,
            recordedByUserId: user.id,
            clientOperationId: data.clientOperationId,
          },
        });

        // DECREMENT FROM USABLE STOCK LEDGER!
        await LedgerService.recordMovement(
          {
            awcId: data.awcId,
            itemId: dist.itemId,
            batchNumber: dist.batchNumber,
            eventType: StockEventType.THR_DISTRIBUTION,
            quantityChange: -dist.quantityDistributed, // Negative change
            unit: UnitOfMeasure.PACKET,
            referenceType: 'THR_DISTRIBUTION',
            referenceId: record.id,
            actorUserId: user.id,
            clientOperationId: data.clientOperationId,
            reasonNote: `THR distribution: ${dist.quantityDistributed} packets to ${dist.beneficiaryCategory} (${data.distributionCycle})`,
          },
          tx
        );

        createdRecords.push(record);
      }

      await AuditService.log(
        {
          actorUserId: user.id,
          actorRole: user.role,
          awcId: data.awcId,
          entityType: 'THR_DISTRIBUTION',
          entityId: createdRecords[0]?.id || 'BATCH',
          action: 'CREATE',
          newValue: { count: data.distributions.length, cycle: data.distributionCycle },
          reasonCode: 'THR_MONTHLY_DISTRIBUTION',
        },
        tx
      );

      if (data.clientOperationId) {
        await tx.syncLog.create({
          data: {
            clientOperationId: data.clientOperationId,
            entityType: 'THR_DISTRIBUTION',
            entityId: createdRecords[0]?.id,
            status: 'PROCESSED',
          },
        });
      }

      return createdRecords;
    });

    return res.status(201).json({
      message: 'THR distribution recorded successfully and stock updated.',
      count: result.length,
      records: result,
    });
  } catch (err: any) {
    console.error('THR distribution error:', err);
    return res.status(400).json({ error: err.message || 'Error recording THR distribution' });
  }
});

// GET /api/thr/history/:awcId — Get distribution history
router.get('/history/:awcId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { awcId } = req.params;
  const isAuthorized = await verifyAwcScope(req.user!, awcId);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Scope violation.' });
  }

  const distributions = await prisma.tHRDistribution.findMany({
    where: { awcId },
    include: {
      item: true,
      beneficiary: true,
      recordedByUser: { select: { fullNameEn: true, fullNameGu: true } },
    },
    orderBy: { distributionDate: 'desc' },
    take: 100,
  });

  return res.json({ distributions });
});

export default router;
