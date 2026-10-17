"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const ledgerService_1 = require("../services/ledgerService");
const auditService_1 = require("../services/auditService");
const router = (0, express_1.Router)();
const recordPhysicalCountSchema = zod_1.z.object({
    awcId: zod_1.z.string().uuid(),
    itemId: zod_1.z.string().uuid(),
    batchNumber: zod_1.z.string().optional(),
    actualPhysicalCount: zod_1.z.number().nonnegative(),
    reasonCode: zod_1.z.string().default('MEASUREMENT_ERROR'),
    explanation: zod_1.z.string().optional(),
    clientOperationId: zod_1.z.string().optional(),
});
// POST /api/physical-count — Record physical inventory count
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const parse = recordPhysicalCountSchema.safeParse(req.body);
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
                    message: 'Physical count has already been processed idempotently.',
                });
            }
        }
        // Compute current authoritative book balance from ledger
        const computedBookBalance = await ledgerService_1.LedgerService.getItemBalance(data.awcId, data.itemId);
        const variance = Number((data.actualPhysicalCount - computedBookBalance).toFixed(3));
        const isMatched = Math.abs(variance) < 0.001;
        const item = await db_1.prisma.item.findUnique({ where: { id: data.itemId } });
        const result = await db_1.prisma.$transaction(async (tx) => {
            const physicalCount = await tx.physicalCount.create({
                data: {
                    awcId: data.awcId,
                    itemId: data.itemId,
                    batchNumber: data.batchNumber,
                    computedBookBalance,
                    actualPhysicalCount: data.actualPhysicalCount,
                    variance,
                    status: isMatched ? client_1.PhysicalCountStatus.MATCHED : client_1.PhysicalCountStatus.PENDING_REVIEW,
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
                        discrepancyType: client_1.DiscrepancyType.PHYSICAL_COUNT_VARIANCE,
                        relatedEntityType: 'PHYSICAL_COUNT',
                        relatedEntityId: physicalCount.id,
                        expectedQuantity: computedBookBalance,
                        actualQuantity: data.actualPhysicalCount,
                        varianceQuantity: variance,
                        unit: item?.unit || 'PACKET',
                        severity: Math.abs(variance) > 5 ? client_1.SeverityLevel.HIGH : client_1.SeverityLevel.MEDIUM,
                        status: client_1.DiscrepancyStatus.OPEN,
                        reportedByUserId: user.id,
                        resolutionNotes: `Physical count variance flagged: Book ${computedBookBalance}, Physical ${data.actualPhysicalCount}, Variance ${variance}. Reason: ${data.reasonCode}. ${data.explanation || ''}`,
                    },
                });
                // Notify Supervisor
                await tx.alert.create({
                    data: {
                        recipientRole: client_1.Role.SUPERVISOR,
                        awcId: data.awcId,
                        alertType: 'UNRESOLVED_DISCREPANCY',
                        severity: client_1.SeverityLevel.HIGH,
                        titleEn: `Stock Count Variance: ${item?.nameEn}`,
                        titleGu: `સ્ટોક ગણતરીમાં તફાવત: ${item?.nameGu}`,
                        messageEn: `Physical count of ${item?.nameEn} differs from book balance by ${variance} ${item?.unit}. Supervisor review required.`,
                        messageGu: `${item?.nameGu} ની વાસ્તવિક ગણતરીમાં ${variance} ${item?.unit} નો તફાવત આવ્યો છે. સમીક્ષા જરૂરી છે.`,
                        linkRoute: '/discrepancies',
                    },
                });
            }
            await auditService_1.AuditService.log({
                actorUserId: user.id,
                actorRole: user.role,
                awcId: data.awcId,
                entityType: 'PHYSICAL_COUNT',
                entityId: physicalCount.id,
                action: 'CREATE',
                newValue: { book: computedBookBalance, counted: data.actualPhysicalCount, variance },
                reasonCode: data.reasonCode,
            }, tx);
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
    }
    catch (err) {
        console.error('Physical count error:', err);
        return res.status(400).json({ error: err.message || 'Error recording physical count' });
    }
});
// GET /api/physical-count/:awcId — Get physical counts history
router.get('/:awcId', auth_1.authenticateToken, async (req, res) => {
    const { awcId } = req.params;
    const isAuthorized = await (0, auth_1.verifyAwcScope)(req.user, awcId);
    if (!isAuthorized) {
        return res.status(403).json({ error: 'Scope violation.' });
    }
    const counts = await db_1.prisma.physicalCount.findMany({
        where: { awcId },
        include: {
            item: true,
        },
        orderBy: { countDate: 'desc' },
    });
    return res.json({ counts });
});
exports.default = router;
