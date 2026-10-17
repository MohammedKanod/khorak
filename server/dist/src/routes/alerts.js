"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/alerts — Active alerts for current user & role
router.get('/', auth_1.authenticateToken, async (req, res) => {
    const user = req.user;
    const whereClause = {
        isRead: false,
        OR: [
            { recipientRole: user.role },
            { recipientUserId: user.id },
        ],
    };
    if (user.awcId) {
        whereClause.OR.push({ awcId: user.awcId });
    }
    const alerts = await db_1.prisma.alert.findMany({
        where: whereClause,
        include: {
            awc: {
                select: { id: true, nameEn: true, nameGu: true, code: true },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });
    return res.json({ alerts });
});
// PATCH /api/alerts/:id/read — Mark alert as read
router.patch('/:id/read', auth_1.authenticateToken, async (req, res) => {
    const alert = await db_1.prisma.alert.update({
        where: { id: req.params.id },
        data: { isRead: true },
    });
    return res.json({ alert });
});
exports.default = router;
