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
// GET /api/discrepancies — List discrepancies scoped by user role
router.get('/', auth_1.authenticateToken, async (req, res) => {
    const user = req.user;
    let whereClause = {};
    if (user.role === client_1.Role.AWW || user.role === client_1.Role.AWH) {
        if (!user.awcId)
            return res.json({ discrepancies: [] });
        whereClause = { awcId: user.awcId };
    }
    else if (user.role === client_1.Role.SUPERVISOR) {
        if (!user.sectorId)
            return res.json({ discrepancies: [] });
        whereClause = { awc: { sectorId: user.sectorId } };
    }
    else if (user.role === client_1.Role.CDPO) {
        if (!user.blockId)
            return res.json({ discrepancies: [] });
        whereClause = { awc: { sector: { blockId: user.blockId } } };
    }
    const { status } = req.query;
    if (status && typeof status === 'string') {
        whereClause.status = status;
    }
    const discrepancies = await db_1.prisma.discrepancy.findMany({
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
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    const discrepancy = await db_1.prisma.discrepancy.findUnique({
        where: { id: req.params.id },
        include: {
            item: true,
            awc: {
                include: { sector: { include: { block: true } } },
            },
        },
    });
    if (!discrepancy)
        return res.status(404).json({ error: 'Discrepancy not found.' });
    const isAuthorized = await (0, auth_1.verifyAwcScope)(req.user, discrepancy.awcId);
    if (!isAuthorized) {
        return res.status(403).json({ error: 'Unauthorized to view this discrepancy.' });
    }
    return res.json({ discrepancy });
});
const discrepancyActionSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVE_ADJUSTMENT', 'REQUEST_RECOUNT', 'REJECT', 'RESOLVE_NOTE']),
    notes: zod_1.z.string().min(3, 'Action explanation/notes are required'),
});
// POST /api/discrepancies/:id/action — Supervisor or CDPO Resolution Action
router.post('/:id/action', auth_1.authenticateToken, (0, auth_1.requireRole)(client_1.Role.SUPERVISOR, client_1.Role.CDPO, client_1.Role.DPO), async (req, res) => {
    try {
        const parse = discrepancyActionSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error.errors[0].message });
        }
        const { action, notes } = parse.data;
        const user = req.user;
        const discrepancy = await db_1.prisma.discrepancy.findUnique({
            where: { id: req.params.id },
            include: { item: true, awc: true },
        });
        if (!discrepancy)
            return res.status(404).json({ error: 'Discrepancy not found.' });
        const isAuthorized = await (0, auth_1.verifyAwcScope)(user, discrepancy.awcId);
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Unauthorized: AWC outside your oversight jurisdiction.' });
        }
        const result = await db_1.prisma.$transaction(async (tx) => {
            let newStatus = client_1.DiscrepancyStatus.INVESTIGATING;
            let ledgerEvent = null;
            if (action === 'APPROVE_ADJUSTMENT') {
                newStatus = client_1.DiscrepancyStatus.APPROVED_ADJUSTED;
                // If linked to a Physical Count, post an explicit adjustment to the stock ledger!
                if (discrepancy.relatedEntityType === 'PHYSICAL_COUNT') {
                    await tx.physicalCount.update({
                        where: { id: discrepancy.relatedEntityId },
                        data: {
                            status: client_1.PhysicalCountStatus.APPROVED,
                            reviewedByUserId: user.id,
                            reviewTimestamp: new Date(),
                            reviewNotes: notes,
                        },
                    });
                    // Adjust stock ledger by the variance quantity
                    ledgerEvent = await ledgerService_1.LedgerService.recordMovement({
                        awcId: discrepancy.awcId,
                        itemId: discrepancy.itemId,
                        eventType: client_1.StockEventType.PHYSICAL_COUNT_ADJUSTMENT,
                        quantityChange: discrepancy.varianceQuantity, // Adjust by variance
                        unit: discrepancy.unit,
                        referenceType: 'DISCREPANCY_APPROVAL',
                        referenceId: discrepancy.id,
                        actorUserId: user.id,
                        reasonNote: `Supervisor Approved Adjustment: ${notes} (Case ${discrepancy.caseNumber})`,
                        allowNegative: true, // Specific supervisor authorized adjustment
                    }, tx);
                }
            }
            else if (action === 'REQUEST_RECOUNT') {
                newStatus = client_1.DiscrepancyStatus.RECOUNT_REQUESTED;
                if (discrepancy.relatedEntityType === 'PHYSICAL_COUNT') {
                    await tx.physicalCount.update({
                        where: { id: discrepancy.relatedEntityId },
                        data: {
                            status: client_1.PhysicalCountStatus.RECOUNT_REQUESTED,
                            reviewedByUserId: user.id,
                            reviewTimestamp: new Date(),
                            reviewNotes: notes,
                        },
                    });
                }
                // Alert AWW
                await tx.alert.create({
                    data: {
                        recipientRole: client_1.Role.AWW,
                        awcId: discrepancy.awcId,
                        alertType: 'UNRESOLVED_DISCREPANCY',
                        titleEn: `Recount Requested: ${discrepancy.item.nameEn}`,
                        titleGu: `ફરીથી ગણતરી કરવા વિનંતી: ${discrepancy.item.nameGu}`,
                        messageEn: `Supervisor requested recount for case ${discrepancy.caseNumber}: ${notes}`,
                        messageGu: `મુખ્ય સેવિકા દ્વારા કેસ ${discrepancy.caseNumber} માટે ફરી ગણતરી કરવા જણાવાયું છે.`,
                        linkRoute: '/physical-count',
                    },
                });
            }
            else if (action === 'REJECT') {
                newStatus = client_1.DiscrepancyStatus.REJECTED;
                if (discrepancy.relatedEntityType === 'PHYSICAL_COUNT') {
                    await tx.physicalCount.update({
                        where: { id: discrepancy.relatedEntityId },
                        data: {
                            status: client_1.PhysicalCountStatus.REJECTED,
                            reviewedByUserId: user.id,
                            reviewTimestamp: new Date(),
                            reviewNotes: notes,
                        },
                    });
                }
            }
            else if (action === 'RESOLVE_NOTE') {
                newStatus = client_1.DiscrepancyStatus.RESOLVED;
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
            await auditService_1.AuditService.log({
                actorUserId: user.id,
                actorRole: user.role,
                awcId: discrepancy.awcId,
                entityType: 'DISCREPANCY',
                entityId: discrepancy.id,
                action: action,
                oldValue: { status: discrepancy.status },
                newValue: { status: newStatus, notes },
                reasonCode: action,
            }, tx);
            return { updated, ledgerEvent };
        });
        return res.json({
            message: `Discrepancy successfully updated with action: ${action}`,
            discrepancy: result.updated,
            ledgerEvent: result.ledgerEvent,
        });
    }
    catch (err) {
        console.error('Discrepancy action error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
});
exports.default = router;
