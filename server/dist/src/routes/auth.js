"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'Username is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const parse = loginSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error.errors[0].message });
        }
        const { username, password } = parse.data;
        const user = await db_1.prisma.user.findUnique({
            where: { username },
            include: {
                awc: true,
                sector: true,
                block: true,
                supplier: true,
            },
        });
        if (!user || !user.active) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        const match = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        const token = (0, auth_1.generateToken)(user);
        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullNameEn: user.fullNameEn,
                fullNameGu: user.fullNameGu,
                role: user.role,
                phone: user.phone,
                languagePreference: user.languagePreference,
                awcId: user.awcId,
                awc: user.awc,
                sectorId: user.sectorId,
                sector: user.sector,
                blockId: user.blockId,
                block: user.block,
                supplierId: user.supplierId,
                supplier: user.supplier,
            },
        });
    }
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error during login.' });
    }
});
// GET /api/auth/me
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: 'Unauthorized' });
    const user = await db_1.prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            awc: {
                include: { sector: { include: { block: true } } },
            },
            sector: { include: { block: true } },
            block: true,
            supplier: true,
        },
    });
    return res.json({ user });
});
// GET /api/auth/demo-accounts (Useful for 1-click test login in the competition demo)
router.get('/demo-accounts', async (_req, res) => {
    const users = await db_1.prisma.user.findMany({
        select: {
            id: true,
            username: true,
            fullNameEn: true,
            fullNameGu: true,
            role: true,
            awc: {
                select: { id: true, code: true, nameEn: true, nameGu: true },
            },
            sector: {
                select: { id: true, nameEn: true, nameGu: true },
            },
            block: {
                select: { id: true, nameEn: true, nameGu: true },
            },
            supplier: {
                select: { id: true, nameEn: true, nameGu: true },
            },
        },
        orderBy: { role: 'asc' },
    });
    return res.json({ demoAccounts: users, defaultPassword: 'khorak123' });
});
exports.default = router;
