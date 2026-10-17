import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.errors[0].message });
    }

    const { username, password } = parse.data;

    const user = await prisma.user.findUnique({
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

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = generateToken(user);

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
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({
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
router.get('/demo-accounts', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
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

export default router;
