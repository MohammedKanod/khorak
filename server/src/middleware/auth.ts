import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'khorak_super_secure_panchmahal_icds_secret_key_2026';

export interface AuthenticatedUser {
  id: string;
  username: string;
  fullNameEn: string;
  fullNameGu: string;
  role: Role;
  languagePreference: string;
  awcId?: string | null;
  sectorId?: string | null;
  blockId?: string | null;
  supplierId?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No bearer token provided.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await prisma.user.findUnique({
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
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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

export async function verifyAwcScope(user: AuthenticatedUser, targetAwcId: string): Promise<boolean> {
  // DPO has district-wide visibility
  if (user.role === Role.DPO) {
    return true;
  }

  // AWW and AWH can only access their assigned AWC
  if (user.role === Role.AWW || user.role === Role.AWH) {
    return user.awcId === targetAwcId;
  }

  // Supervisor can access any AWC in their assigned Sector
  if (user.role === Role.SUPERVISOR) {
    if (!user.sectorId) return false;
    const awc = await prisma.aWC.findUnique({
      where: { id: targetAwcId },
      select: { sectorId: true },
    });
    return awc?.sectorId === user.sectorId;
  }

  // CDPO can access any AWC in their assigned Block
  if (user.role === Role.CDPO) {
    if (!user.blockId) return false;
    const awc = await prisma.aWC.findUnique({
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
