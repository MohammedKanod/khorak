"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/items — Master nutrition catalog with active batches
router.get('/', auth_1.authenticateToken, async (_req, res) => {
    const items = await db_1.prisma.item.findMany({
        include: {
            batches: {
                orderBy: { expiryDate: 'asc' },
            },
        },
        orderBy: [{ category: 'asc' }, { nameEn: 'asc' }],
    });
    return res.json({ items });
});
exports.default = router;
