"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const ledgerService_1 = require("../services/ledgerService");
const router = (0, express_1.Router)();
// GET /api/awc — List accessible AWCs based on role
router.get('/', auth_1.authenticateToken, async (req, res) => {
    const user = req.user;
    let whereClause = {};
    if (user.role === client_1.Role.AWW || user.role === client_1.Role.AWH) {
        if (!user.awcId)
            return res.json({ awcs: [] });
        whereClause = { id: user.awcId };
    }
    else if (user.role === client_1.Role.SUPERVISOR) {
        if (!user.sectorId)
            return res.json({ awcs: [] });
        whereClause = { sectorId: user.sectorId };
    }
    else if (user.role === client_1.Role.CDPO) {
        if (!user.blockId)
            return res.json({ awcs: [] });
        whereClause = { sector: { blockId: user.blockId } };
    }
    else if (user.role === client_1.Role.SUPPLIER) {
        // Supplier can see destination AWCs from dispatches
        return res.json({ awcs: [] });
    }
    const awcs = await db_1.prisma.aWC.findMany({
        where: whereClause,
        include: {
            sector: {
                include: { block: true },
            },
            discrepancies: {
                where: { status: 'OPEN' },
            },
            writeOffRequests: {
                where: { status: { in: ['PENDING_SUPERVISOR', 'PENDING_CDPO'] } },
            },
        },
        orderBy: { code: 'asc' },
    });
    return res.json({ awcs });
});
// GET /api/awc/:id — Get details of a specific AWC
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    const awcId = req.params.id;
    const isAuthorized = await (0, auth_1.verifyAwcScope)(req.user, awcId);
    if (!isAuthorized) {
        return res.status(403).json({ error: 'Access denied to this Anganwadi Centre.' });
    }
    const awc = await db_1.prisma.aWC.findUnique({
        where: { id: awcId },
        include: {
            sector: {
                include: { block: true },
            },
            users: {
                select: {
                    id: true,
                    fullNameEn: true,
                    fullNameGu: true,
                    role: true,
                    phone: true,
                },
            },
            discrepancies: {
                where: { status: 'OPEN' },
                include: { item: true },
            },
            writeOffRequests: {
                where: { status: { in: ['PENDING_SUPERVISOR', 'PENDING_CDPO'] } },
                include: { item: true },
            },
        },
    });
    if (!awc)
        return res.status(404).json({ error: 'AWC not found.' });
    const stockOverview = await ledgerService_1.LedgerService.getAWCStockOverview(awcId);
    return res.json({ awc, stockOverview });
});
// GET /api/awc/overview/heatmap — Sector/Block Heatmap for Supervisors & CDPOs
router.get('/overview/heatmap', auth_1.authenticateToken, async (req, res) => {
    const user = req.user;
    let whereClause = {};
    if (user.role === client_1.Role.SUPERVISOR) {
        if (!user.sectorId)
            return res.json({ heatmap: [] });
        whereClause = { sectorId: user.sectorId };
    }
    else if (user.role === client_1.Role.CDPO) {
        if (!user.blockId)
            return res.json({ heatmap: [] });
        whereClause = { sector: { blockId: user.blockId } };
    }
    else if (user.role === client_1.Role.DPO) {
        // District wide
        whereClause = {};
    }
    else {
        return res.status(403).json({ error: 'Heatmap is for supervisory oversight roles only.' });
    }
    const awcs = await db_1.prisma.aWC.findMany({
        where: whereClause,
        include: {
            sector: { include: { block: true } },
            discrepancies: {
                where: { status: 'OPEN' },
            },
            writeOffRequests: {
                where: { status: { in: ['PENDING_SUPERVISOR', 'PENDING_CDPO'] } },
            },
            stockLedgerEvents: {
                take: 1,
                orderBy: { serverCreatedAt: 'desc' },
                select: { serverCreatedAt: true },
            },
        },
    });
    const heatmap = await Promise.all(awcs.map(async (awc) => {
        const stock = await ledgerService_1.LedgerService.getAWCStockOverview(awc.id);
        const hasCriticalStock = stock.some((s) => s.stockStatus === 'CRITICAL');
        const hasLowStock = stock.some((s) => s.stockStatus === 'LOW');
        const openDiscrepanciesCount = awc.discrepancies.length;
        const pendingWriteOffsCount = awc.writeOffRequests.length;
        const lastUpdate = awc.stockLedgerEvents[0]?.serverCreatedAt || null;
        let statusColor = 'GREEN';
        let statusReason = 'All operations normal';
        if (openDiscrepanciesCount > 0) {
            statusColor = 'RED';
            statusReason = `${openDiscrepanciesCount} open discrepancy cases`;
        }
        else if (hasCriticalStock) {
            statusColor = 'RED';
            statusReason = 'Critical low stock detected';
        }
        else if (hasLowStock || pendingWriteOffsCount > 0) {
            statusColor = 'AMBER';
            statusReason = hasLowStock ? 'Low stock on one or more items' : 'Pending write-off approval';
        }
        return {
            id: awc.id,
            code: awc.code,
            nameEn: awc.nameEn,
            nameGu: awc.nameGu,
            sectorName: awc.sector.nameEn,
            blockName: awc.sector.block.nameEn,
            statusColor,
            statusReason,
            openDiscrepanciesCount,
            pendingWriteOffsCount,
            lastUpdate,
            enrolledBeneficiariesCount: awc.enrolledBeneficiariesCount,
        };
    }));
    return res.json({
        summary: {
            total: heatmap.length,
            green: heatmap.filter((h) => h.statusColor === 'GREEN').length,
            amber: heatmap.filter((h) => h.statusColor === 'AMBER').length,
            red: heatmap.filter((h) => h.statusColor === 'RED').length,
        },
        heatmap,
    });
});
exports.default = router;
