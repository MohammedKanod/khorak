import { Router, Response } from 'express';
import { StockEventType } from '@prisma/client';
import { prisma } from '../db';
import { authenticateToken, AuthRequest, verifyAwcScope } from '../middleware/auth';
import { LedgerService } from '../services/ledgerService';

const router = Router();

// GET /api/stock — Convenience route for authenticated user's assigned AWC
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const awcId = req.user?.awcId;
  if (!awcId) {
    return res.status(400).json({ error: 'User does not have an assigned AWC. Specify /awc/:awcId.' });
  }
  const stockOverview = await LedgerService.getAWCStockOverview(awcId);
  return res.json({ stockOverview });
});

// GET /api/stock/awc/:awcId — Current computed stock for an AWC
router.get('/awc/:awcId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { awcId } = req.params;
  const isAuthorized = await verifyAwcScope(req.user!, awcId);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Scope violation: Unauthorized to view stock for this AWC.' });
  }

  const stockOverview = await LedgerService.getAWCStockOverview(awcId);
  return res.json({ stockOverview });
});

// GET /api/stock/ledger/:awcId — Filterable append-only ledger transaction history
router.get('/ledger/:awcId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { awcId } = req.params;
  const isAuthorized = await verifyAwcScope(req.user!, awcId);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Scope violation: Unauthorized to view ledger for this AWC.' });
  }

  const { itemId, eventType, startDate, endDate, limit = '50', offset = '0' } = req.query;

  const whereClause: any = { awcId };

  if (itemId && typeof itemId === 'string') {
    whereClause.itemId = itemId;
  }

  if (eventType && typeof eventType === 'string') {
    whereClause.eventType = eventType as StockEventType;
  }

  if (startDate || endDate) {
    whereClause.serverCreatedAt = {};
    if (startDate) whereClause.serverCreatedAt.gte = new Date(startDate as string);
    if (endDate) whereClause.serverCreatedAt.lte = new Date(endDate as string);
  }

  const total = await prisma.stockLedgerEvent.count({ where: whereClause });

  const events = await prisma.stockLedgerEvent.findMany({
    where: whereClause,
    include: {
      item: true,
      awc: { select: { id: true, code: true, nameEn: true, nameGu: true } },
    },
    orderBy: { serverCreatedAt: 'desc' },
    take: parseInt(limit as string, 10),
    skip: parseInt(offset as string, 10),
  });

  return res.json({
    total,
    events,
    limit: parseInt(limit as string, 10),
    offset: parseInt(offset as string, 10),
  });
});

export default router;
