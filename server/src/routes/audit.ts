import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, verifyAwcScope } from '../middleware/auth';

const router = Router();

// GET /api/audit — Queryable append-only audit trail
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { awcId, entityType, action, limit = '50', offset = '0' } = req.query;

  const whereClause: any = {};

  if (awcId && typeof awcId === 'string') {
    const isAuthorized = await verifyAwcScope(req.user!, awcId);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Scope violation.' });
    }
    whereClause.awcId = awcId;
  } else if (req.user!.role === 'AWW' || req.user!.role === 'AWH') {
    whereClause.awcId = req.user!.awcId;
  }

  if (entityType && typeof entityType === 'string') {
    whereClause.entityType = entityType;
  }

  if (action && typeof action === 'string') {
    whereClause.action = action;
  }

  const total = await prisma.auditLog.count({ where: whereClause });

  const logs = await prisma.auditLog.findMany({
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
    take: parseInt(limit as string, 10),
    skip: parseInt(offset as string, 10),
  });

  return res.json({
    total,
    logs,
    limit: parseInt(limit as string, 10),
    offset: parseInt(offset as string, 10),
  });
});

export default router;
