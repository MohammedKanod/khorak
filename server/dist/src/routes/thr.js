"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const ledgerService_1 = require("../services/ledgerService");
const auditService_1 = require("../services/auditService");
const router = (0, express_1.Router)();
// GET /api/thr/beneficiaries/:awcId — List beneficiaries for AWC
router.get('/beneficiaries/:awcId', auth_1.authenticateToken, async (req, res) => {
    const { awcId } = req.params;
    const isAuthorized = await (0, auth_1.verifyAwcScope)(req.user, awcId);
    if (!isAuthorized) {
        return res.status(403).json({ error: 'Scope violation: Unauthorized to view beneficiaries for this AWC.' });
    }
    const beneficiaries = await db_1.prisma.beneficiary.findMany({
        where: { awcId, active: true },
        orderBy: [{ category: 'asc' }, { fullNameEn: 'asc' }],
    });
    return res.json({ beneficiaries });
});
// POST /api/thr/beneficiaries — Register new beneficiary (Data minimization: SHA-256 hashed ID only)
const createBeneficiarySchema = zod_1.z.object({
    awcId: zod_1.z.string().uuid(),
    fullNameEn: zod_1.z.string().min(2, 'Name is required'),
    fullNameGu: zod_1.z.string().min(2, 'Name in Gujarati is required'),
    category: zod_1.z.nativeEnum(client_1.BeneficiaryCategory),
    guardianName: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string(), // ISO date
    gender: zod_1.z.string().default('FEMALE'),
    aadhaarRaw: zod_1.z.string().optional(), // We immediately hash this and DO NOT store raw
});
router.post('/beneficiaries', auth_1.authenticateToken, async (req, res) => {
    try {
        const parse = createBeneficiarySchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error.errors[0].message });
        }
        const data = parse.data;
        const isAuthorized = await (0, auth_1.verifyAwcScope)(req.user, data.awcId);
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Scope violation: Unauthorized.' });
        }
        const hashedAadhaar = data.aadhaarRaw
            ? crypto_1.default.createHash('sha256').update(data.aadhaarRaw).digest('hex')
            : `synth_id_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const beneficiary = await db_1.prisma.beneficiary.create({
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
        await db_1.prisma.aWC.update({
            where: { id: data.awcId },
            data: { enrolledBeneficiariesCount: { increment: 1 } },
        });
        return res.status(201).json({ beneficiary });
    }
    catch (err) {
        console.error('Create beneficiary error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
});
// POST /api/thr/distribute — Record THR Distribution (Single or Batch Roster)
const distributeThrSchema = zod_1.z.object({
    awcId: zod_1.z.string().uuid(),
    distributionCycle: zod_1.z.string().default('OCT-2026'),
    distributionDate: zod_1.z.string().optional(),
    distributions: zod_1.z.array(zod_1.z.object({
        beneficiaryId: zod_1.z.string().uuid().optional(),
        beneficiaryCategory: zod_1.z.nativeEnum(client_1.BeneficiaryCategory),
        itemId: zod_1.z.string().uuid(),
        batchNumber: zod_1.z.string().optional(),
        quantityDistributed: zod_1.z.number().positive('Quantity must be greater than zero'),
        acknowledgmentType: zod_1.z.string().default('SCREEN_SIGNATURE'),
        signatureData: zod_1.z.string().optional(),
        photoUrl: zod_1.z.string().optional(),
    })).min(1, 'At least one distribution entry is required'),
    clientOperationId: zod_1.z.string().optional(),
});
router.post('/distribute', auth_1.authenticateToken, async (req, res) => {
    try {
        const parse = distributeThrSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error.errors[0].message });
        }
        const data = parse.data;
        const user = req.user;
        const isAuthorized = await (0, auth_1.verifyAwcScope)(user, data.awcId);
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Scope violation: Unauthorized.' });
        }
        // Idempotency check
        if (data.clientOperationId) {
            const existingSync = await db_1.prisma.syncLog.findUnique({
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
        const result = await db_1.prisma.$transaction(async (tx) => {
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
                        unit: client_1.UnitOfMeasure.PACKET,
                        acknowledgmentType: dist.acknowledgmentType,
                        signatureData: dist.signatureData,
                        photoUrl: dist.photoUrl,
                        recordedByUserId: user.id,
                        clientOperationId: data.clientOperationId,
                    },
                });
                // DECREMENT FROM USABLE STOCK LEDGER!
                await ledgerService_1.LedgerService.recordMovement({
                    awcId: data.awcId,
                    itemId: dist.itemId,
                    batchNumber: dist.batchNumber,
                    eventType: client_1.StockEventType.THR_DISTRIBUTION,
                    quantityChange: -dist.quantityDistributed, // Negative change
                    unit: client_1.UnitOfMeasure.PACKET,
                    referenceType: 'THR_DISTRIBUTION',
                    referenceId: record.id,
                    actorUserId: user.id,
                    clientOperationId: data.clientOperationId,
                    reasonNote: `THR distribution: ${dist.quantityDistributed} packets to ${dist.beneficiaryCategory} (${data.distributionCycle})`,
                }, tx);
                createdRecords.push(record);
            }
            await auditService_1.AuditService.log({
                actorUserId: user.id,
                actorRole: user.role,
                awcId: data.awcId,
                entityType: 'THR_DISTRIBUTION',
                entityId: createdRecords[0]?.id || 'BATCH',
                action: 'CREATE',
                newValue: { count: data.distributions.length, cycle: data.distributionCycle },
                reasonCode: 'THR_MONTHLY_DISTRIBUTION',
            }, tx);
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
    }
    catch (err) {
        console.error('THR distribution error:', err);
        return res.status(400).json({ error: err.message || 'Error recording THR distribution' });
    }
});
// GET /api/thr/history/:awcId — Get distribution history
router.get('/history/:awcId', auth_1.authenticateToken, async (req, res) => {
    const { awcId } = req.params;
    const isAuthorized = await (0, auth_1.verifyAwcScope)(req.user, awcId);
    if (!isAuthorized) {
        return res.status(403).json({ error: 'Scope violation.' });
    }
    const distributions = await db_1.prisma.tHRDistribution.findMany({
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
exports.default = router;
