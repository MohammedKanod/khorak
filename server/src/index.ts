import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import awcRouter from './routes/awc';
import itemsRouter from './routes/items';
import stockRouter from './routes/stock';
import dispatchesRouter from './routes/dispatches';
import receiptsRouter from './routes/receipts';
import thrRouter from './routes/thr';
import hcmRouter from './routes/hcm';
import physicalCountRouter from './routes/physicalCount';
import discrepanciesRouter from './routes/discrepancies';
import writeOffRouter from './routes/writeOff';
import alertsRouter from './routes/alerts';
import reportsRouter from './routes/reports';
import auditRouter from './routes/audit';
import syncRouter from './routes/sync';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
}));

// Generous body limit for offline sync batches and signature/photo payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    app: 'KHORAK — Supplementary Nutrition Supply Chain Tracker',
    scheme: 'ICDS Gujarat',
    challenge: 'Seva First Innovation Challenge 2026',
    problemStatement: 'PS000052',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/awc', awcRouter);
app.use('/api/items', itemsRouter);
app.use('/api/stock', stockRouter);
app.use('/api/dispatches', dispatchesRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/thr', thrRouter);
app.use('/api/hcm', hcmRouter);
app.use('/api/physical-count', physicalCountRouter);
app.use('/api/discrepancies', discrepanciesRouter);
app.use('/api/write-off', writeOffRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/sync', syncRouter);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: err.message || 'An unexpected internal server error occurred.',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 KHORAK Server listening on http://localhost:${PORT}`);
    console.log(`📦 Problem Statement PS000052 - Panchmahal District, Gujarat`);
  });
}

export default app;
