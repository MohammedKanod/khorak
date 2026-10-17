"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/audit — Queryable append-only audit trail
router.get('/', auth_1.authenticateToken, async (req, res) => {
    const { awcId, entityType, action, limit = '50', offset = '0' } = req.query;
    const whereClause = {};
    if (awcId && typeof awcId === 'string') {
        const isAuthorized = await (0, auth_1.verifyAwcScope)(req.user, awcId);
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Scope violation.' });
        }
        whereClause.awcId = awcId;
    }
    else if (req.user.role === 'AWW' || req.user.role === 'AWH') {
        whereClause.awcId = req.user.awcId;
    }
    if (entityType && typeof entityType === 'string') {
        whereClause.entityType = entityType;
    }
    if (action && typeof action === 'string') {
        whereClause.action = action;
    }
    const total = await db_1.prisma.auditLog.count({ where: whereClause });
    const logs = await db_1.prisma.auditLog.findMany({
        where: whereClause,
        include: {
            actorUser: {
                select: {
                    fullNameEn: true,
                    fullNameGu: true,
                    username: true,
                    role: true,
                },
            },
            awc: {
                select: {
                    code: true,
                    nameEn: true,
                    nameGu: true,
                },
            },
        },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
    });
    return res.json({
        total,
        logs,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
    });
});
exports.default = router;
