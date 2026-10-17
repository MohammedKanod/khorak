"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const auditService_1 = require("../services/auditService");
const router = (0, express_1.Router)();
const createDispatchSchema = zod_1.z.object({
    challanNumber: zod_1.z.string().min(3, 'Challan number is required'),
    destinationAwcId: zod_1.z.string().uuid('Valid AWC is required'),
    supplierId: zod_1.z.string().uuid().optional(),
    vehicleNumber: zod_1.z.string().optional(),
    driverName: zod_1.z.string().optional(),
    driverPhone: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(zod_1.z.object({
        itemId: zod_1.z.string().uuid(),
        batchNumber: zod_1.z.string().optional(),
        quantityDispatched: zod_1.z.number().positive('Quantity must be greater than zero'),
        unit: zod_1.z.nativeEnum(client_1.UnitOfMeasure),
    })).min(1, 'At least one item is required in the dispatch'),
});
// GET /api/dispatches — List dispatches scoped by role
router.get('/', auth_1.authenticateToken, async (req, res) => {
    const user = req.user;
    let whereClause = {};
    if (user.role === client_1.Role.SUPPLIER) {
        if (!user.supplierId)
            return res.json({ dispatches: [] });
        whereClause.supplierId = user.supplierId;
    }
    else if (user.role === client_1.Role.AWW || user.role === client_1.Role.AWH) {
        if (!user.awcId)
            return res.json({ dispatches: [] });
        whereClause.destinationAwcId = user.awcId;
    }
    else if (user.role === client_1.Role.SUPERVISOR) {
        if (!user.sectorId)
            return res.json({ dispatches: [] });
        whereClause.destinationAwc = { sectorId: user.sectorId };
    }
    else if (user.role === client_1.Role.CDPO) {
        if (!user.blockId)
            return res.json({ dispatches: [] });
        whereClause.destinationAwc = { sector: { blockId: user.blockId } };
    }
    const dispatches = await db_1.prisma.dispatch.findMany({
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
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    const dispatch = await db_1.prisma.dispatch.findUnique({
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
    if (!dispatch)
        return res.status(404).json({ error: 'Dispatch not found.' });
    return res.json({ dispatch });
});
// POST /api/dispatches — Create new dispatch (Supplier or CDPO only)
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(client_1.Role.SUPPLIER, client_1.Role.CDPO), async (req, res) => {
    try {
        const parse = createDispatchSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error.errors[0].message });
        }
        const data = parse.data;
        const user = req.user;
        const supplierId = user.role === client_1.Role.SUPPLIER ? user.supplierId : data.supplierId;
        if (!supplierId) {
            return res.status(400).json({ error: 'Valid supplier must be associated with dispatch.' });
        }
        // Check duplicate challan
        const existing = await db_1.prisma.dispatch.findUnique({
            where: { challanNumber: data.challanNumber },
        });
        if (existing) {
            return res.status(409).json({
                error: `Delivery challan ${data.challanNumber} has already been registered in the system.`,
            });
        }
        const count = await db_1.prisma.dispatch.count();
        const dispatchNumber = `DSP-2026-${String(count + 1).padStart(4, '0')}`;
        const dispatch = await db_1.prisma.$transaction(async (tx) => {
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
                    status: client_1.DispatchStatus.DISPATCHED,
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
                    recipientRole: client_1.Role.AWW,
                    awcId: data.destinationAwcId,
                    alertType: 'NEW_DELIVERY_INCOMING',
                    severity: client_1.SeverityLevel.MEDIUM,
                    titleEn: 'New Delivery Dispatched',
                    titleGu: 'નવો પુરવઠો ડિસ્પેચ થયો છે',
                    messageEn: `Challan ${data.challanNumber} has been dispatched. Please prepare to receive.`,
                    messageGu: `ચલણ ${data.challanNumber} રવાના થયેલ છે. આંગણવાડી પર પહોંચ્યા પછી ચકાસણી કરો.`,
                    linkRoute: '/dispatches',
                },
            });
            await auditService_1.AuditService.log({
                actorUserId: user.id,
                actorRole: user.role,
                awcId: data.destinationAwcId,
                entityType: 'DISPATCH',
                entityId: created.id,
                action: 'CREATE',
                newValue: { dispatchNumber, challanNumber: data.challanNumber, items: data.items },
                reasonCode: 'SUPPLIER_DISPATCH_LOGGED',
            }, tx);
            return created;
        });
        return res.status(201).json({ dispatch });
    }
    catch (err) {
        console.error('Dispatch creation error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
});
exports.default = router;
