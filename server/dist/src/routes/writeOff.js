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
const createWriteOffSchema = zod_1.z.object({
    awcId: zod_1.z.string().uuid(),
    itemId: zod_1.z.string().uuid(),
    batchNumber: zod_1.z.string().optional(),
    quantity: zod_1.z.number().positive('Quantity must be greater than zero'),
    unit: zod_1.z.nativeEnum(client_1.UnitOfMeasure),
    reasonCode: zod_1.z.string().min(1, 'Reason code is required'),
    explanation: zod_1.z.string().optional(),
    voiceNoteTranscript: zod_1.z.string().optional(),
    photoUrl: zod_1.z.string().optional(),
    clientOperationId: zod_1.z.string().optional(),
});
// POST /api/write-off — AWW reports damaged, spoiled, or expired stock
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const parse = createWriteOffSchema.safeParse(req.body);
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
                    message: 'Write-off report has already been processed idempotently.',
                });
            }
        }
        const count = await db_1.prisma.writeOffRequest.count();
        const caseNumber = `WRO-2026-${String(count + 1).padStart(4, '0')}`;
        // Approval threshold: >= 5 packets or >= 2.5 kg requires CDPO approval
        const isHighQuantity = data.quantity >= 5;
        const initialStatus = isHighQuantity
            ? client_1.WriteOffStatus.PENDING_CDPO
            : client_1.WriteOffStatus.PENDING_SUPERVISOR;
        const item = await db_1.prisma.item.findUnique({ where: { id: data.itemId } });
        const result = await db_1.prisma.$transaction(async (tx) => {
            const writeOff = await tx.writeOffRequest.create({
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
                    clientOperationId: data.clientOperationId,
                },
            });
            // Alert designated approver
            const targetRole = isHighQuantity ? client_1.Role.CDPO : client_1.Role.SUPERVISOR;
            await tx.alert.create({
                data: {
                    recipientRole: targetRole,
                    awcId: data.awcId,
                    alertType: 'UNRESOLVED_DISCREPANCY',
                    severity: client_1.SeverityLevel.HIGH,
                    titleEn: `Spoilage / Damage Reported: ${item?.nameEn}`,
                    titleGu: `બગાડ / નુકસાનની નોંધ: ${item?.nameGu}`,
                    messageEn: `Write-off requested for ${data.quantity} ${data.unit} (${data.reasonCode}). Approval required.`,
                    messageGu: `${data.quantity} ${data.unit} ના નુકસાનની મંજૂરી માટે વિનંતી આવી છે (${data.reasonCode}).`,
                    linkRoute: '/write-off',
                },
            });
            await auditService_1.AuditService.log({
                actorUserId: user.id,
                actorRole: user.role,
                awcId: data.awcId,
                entityType: 'WRITE_OFF',
                entityId: writeOff.id,
                action: 'CREATE',
                newValue: { caseNumber, quantity: data.quantity, reason: data.reasonCode, status: initialStatus },
                reasonCode: data.reasonCode,
            }, tx);
            if (data.clientOperationId) {
                await tx.syncLog.create({
                    data: {
                        clientOperationId: data.clientOperationId,
                        entityType: 'WRITE_OFF',
                        entityId: writeOff.id,
                        status: 'PROCESSED',
                    },
                });
            }
            return writeOff;
        });
        return res.status(201).json({
            message: 'Spoilage report logged and submitted for approval. Stock balance remains unchanged until approval.',
            writeOff: result,
        });
    }
    catch (err) {
        console.error('Write-off creation error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
});
// GET /api/write-off — List write-offs scoped by role
router.get('/', auth_1.authenticateToken, async (req, res) => {
    const user = req.user;
    let whereClause = {};
    if (user.role === client_1.Role.AWW || user.role === client_1.Role.AWH) {
        if (!user.awcId)
            return res.json({ writeOffs: [] });
        whereClause = { awcId: user.awcId };
    }
    else if (user.role === client_1.Role.SUPERVISOR) {
        if (!user.sectorId)
            return res.json({ writeOffs: [] });
        whereClause = { awc: { sectorId: user.sectorId } };
    }
    else if (user.role === client_1.Role.CDPO) {
        if (!user.blockId)
            return res.json({ writeOffs: [] });
        whereClause = { awc: { sector: { blockId: user.blockId } } };
    }
    const writeOffs = await db_1.prisma.writeOffRequest.findMany({
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
    return res.json({ writeOffs });
});
const decideWriteOffSchema = zod_1.z.object({
    decision: zod_1.z.enum(['APPROVE', 'REJECT']),
    notes: zod_1.z.string().min(3, 'Decision notes are required'),
});
// POST /api/write-off/:id/decide — Supervisor or CDPO decision on write-off
router.post('/:id/decide', auth_1.authenticateToken, (0, auth_1.requireRole)(client_1.Role.SUPERVISOR, client_1.Role.CDPO, client_1.Role.DPO), async (req, res) => {
    try {
        const parse = decideWriteOffSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error.errors[0].message });
        }
        const { decision, notes } = parse.data;
        const user = req.user;
        const writeOff = await db_1.prisma.writeOffRequest.findUnique({
            where: { id: req.params.id },
            include: { item: true, awc: true },
        });
        if (!writeOff)
            return res.status(404).json({ error: 'Write-off request not found.' });
        const isAuthorized = await (0, auth_1.verifyAwcScope)(user, writeOff.awcId);
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Unauthorized to decide on this request.' });
        }
        const result = await db_1.prisma.$transaction(async (tx) => {
            let ledgerEvent = null;
            if (decision === 'APPROVE') {
                // POST APPROVED WRITE-OFF TO STOCK LEDGER!
                ledgerEvent = await ledgerService_1.LedgerService.recordMovement({
                    awcId: writeOff.awcId,
                    itemId: writeOff.itemId,
                    batchNumber: writeOff.batchNumber,
                    eventType: client_1.StockEventType.APPROVED_WRITE_OFF,
                    quantityChange: -writeOff.quantity, // Decrements stock!
                    unit: writeOff.unit,
                    referenceType: 'WRITE_OFF_APPROVAL',
                    referenceId: writeOff.id,
                    actorUserId: user.id,
                    reasonNote: `Approved write-off (${writeOff.reasonCode}): ${notes} (Case ${writeOff.caseNumber})`,
                }, tx);
            }
            const updated = await tx.writeOffRequest.update({
                where: { id: writeOff.id },
                data: {
                    status: decision === 'APPROVE' ? client_1.WriteOffStatus.APPROVED : client_1.WriteOffStatus.REJECTED,
                    supervisorId: user.role === client_1.Role.SUPERVISOR ? user.id : writeOff.supervisorId,
                    cdpoId: user.role === client_1.Role.CDPO ? user.id : writeOff.cdpoId,
                    approvalNotes: notes,
                    actionTimestamp: new Date(),
                },
            });
            await auditService_1.AuditService.log({
                actorUserId: user.id,
                actorRole: user.role,
                awcId: writeOff.awcId,
                entityType: 'WRITE_OFF',
                entityId: writeOff.id,
                action: decision,
                oldValue: { status: writeOff.status },
                newValue: { status: updated.status, notes },
                reasonCode: decision,
            }, tx);
            return { updated, ledgerEvent };
        });
        return res.json({
            message: `Write-off request ${decision === 'APPROVE' ? 'approved and stock updated' : 'rejected'}.`,
            writeOff: result.updated,
            ledgerEvent: result.ledgerEvent,
        });
    }
    catch (err) {
        console.error('Write-off decision error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
});
exports.default = router;
