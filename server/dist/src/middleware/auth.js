"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
exports.verifyAwcScope = verifyAwcScope;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const db_1 = require("../db");
const JWT_SECRET = process.env.JWT_SECRET || 'khorak_super_secure_panchmahal_icds_secret_key_2026';
function generateToken(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        username: user.username,
        role: user.role,
    }, JWT_SECRET, { expiresIn: '7d' });
}
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authentication required. No bearer token provided.' });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await db_1.prisma.user.findUnique({
            where: { id: payload.id },
            select: {
                id: true,
                username: true,
                fullNameEn: true,
                fullNameGu: true,
                role: true,
                languagePreference: true,
                awcId: true,
                sectorId: true,
                blockId: true,
                supplierId: true,
                active: true,
            },
        });
        if (!user || !user.active) {
            return res.status(401).json({ error: 'User session invalid or account inactive.' });
        }
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized. Please login.' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Forbidden. Role '${req.user.role}' lacks permission for this operation. Required: [${allowedRoles.join(', ')}]`,
            });
        }
        next();
    };
}
async function verifyAwcScope(user, targetAwcId) {
    // DPO has district-wide visibility
    if (user.role === client_1.Role.DPO) {
        return true;
    }
    // AWW and AWH can only access their assigned AWC
    if (user.role === client_1.Role.AWW || user.role === client_1.Role.AWH) {
        return user.awcId === targetAwcId;
    }
    // Supervisor can access any AWC in their assigned Sector
    if (user.role === client_1.Role.SUPERVISOR) {
        if (!user.sectorId)
            return false;
        const awc = await db_1.prisma.aWC.findUnique({
            where: { id: targetAwcId },
            select: { sectorId: true },
        });
        return awc?.sectorId === user.sectorId;
    }
    // CDPO can access any AWC in their assigned Block
    if (user.role === client_1.Role.CDPO) {
        if (!user.blockId)
            return false;
        const awc = await db_1.prisma.aWC.findUnique({
            where: { id: targetAwcId },
            select: {
                sector: {
                    select: { blockId: true },
                },
            },
        });
        return awc?.sector?.blockId === user.blockId;
    }
    return false;
}
