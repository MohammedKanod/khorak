import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/alerts — Active alerts for current user & role
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const whereClause: any = {
    isRead: false,
    OR: [
      { recipientRole: user.role },
      { recipientUserId: user.id },
    ],
  };

  if (user.awcId) {
    whereClause.OR.push({ awcId: user.awcId });
  }

  const alerts = await prisma.alert.findMany({
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
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  const alert = await prisma.alert.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });

  return res.json({ alert });
});

export default router;
