import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/items — Master nutrition catalog with active batches
router.get('/', authenticateToken, async (_req: Request, res: Response) => {
  const items = await prisma.item.findMany({
    include: {
      batches: {
        orderBy: { expiryDate: 'asc' },
      },
    },
    orderBy: [{ category: 'asc' }, { nameEn: 'asc' }],
  });

  return res.json({ items });
});

export default router;
