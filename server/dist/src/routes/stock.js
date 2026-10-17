"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const ledgerService_1 = require("../services/ledgerService");
const router = (0, express_1.Router)();
// GET /api/stock — Convenience route for authenticated user's assigned AWC
router.get('/', auth_1.authenticateToken, async (req, res) => {
    const awcId = req.user?.awcId;
    if (!awcId) {
        return res.status(400).json({ error: 'User does not have an assigned AWC. Specify /awc/:awcId.' });
    }
    const stockOverview = await ledgerService_1.LedgerService.getAWCStockOverview(awcId);
    return res.json({ stockOverview });
});
// GET /api/stock/awc/:awcId — Current computed stock for an AWC
router.get('/awc/:awcId', auth_1.authenticateToken, async (req, res) => {
    const { awcId } = req.params;
    const isAuthorized = await (0, auth_1.verifyAwcScope)(req.user, awcId);
    if (!isAuthorized) {
        return res.status(403).json({ error: 'Scope violation: Unauthorized to view stock for this AWC.' });
    }
    const stockOverview = await ledgerService_1.LedgerService.getAWCStockOverview(awcId);
    return res.json({ stockOverview });
});
// GET /api/stock/ledger/:awcId — Filterable append-only ledger transaction history
router.get('/ledger/:awcId', auth_1.authenticateToken, async (req, res) => {
    const { awcId } = req.params;
    const isAuthorized = await (0, auth_1.verifyAwcScope)(req.user, awcId);
    if (!isAuthorized) {
        return res.status(403).json({ error: 'Scope violation: Unauthorized to view ledger for this AWC.' });
    }
    const { itemId, eventType, startDate, endDate, limit = '50', offset = '0' } = req.query;
    const whereClause = { awcId };
    if (itemId && typeof itemId === 'string') {
        whereClause.itemId = itemId;
    }
    if (eventType && typeof eventType === 'string') {
        whereClause.eventType = eventType;
    }
    if (startDate || endDate) {
        whereClause.serverCreatedAt = {};
        if (startDate)
            whereClause.serverCreatedAt.gte = new Date(startDate);
        if (endDate)
            whereClause.serverCreatedAt.lte = new Date(endDate);
    }
    const total = await db_1.prisma.stockLedgerEvent.count({ where: whereClause });
    const events = await db_1.prisma.stockLedgerEvent.findMany({
        where: whereClause,
        include: {
            item: true,
            awc: { select: { id: true, code: true, nameEn: true, nameGu: true } },
        },
        orderBy: { serverCreatedAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
    });
    return res.json({
        total,
        events,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
    });
});
exports.default = router;
