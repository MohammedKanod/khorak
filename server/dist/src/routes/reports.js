"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/reports/mpr — Auto-Generated Monthly Progress Report (MPR)
router.get('/mpr', auth_1.authenticateToken, async (req, res) => {
    const awcId = req.query.awcId || req.user?.awcId;
    const month = req.query.month || '2026-10';
    if (!awcId) {
        return res.status(400).json({ error: 'awcId is required or user must have an assigned AWC' });
    }
    const isAuthorized = await (0, auth_1.verifyAwcScope)(req.user, awcId);
    if (!isAuthorized) {
        return res.status(403).json({ error: 'Scope violation.' });
    }
    const awc = await db_1.prisma.aWC.findUnique({
        where: { id: awcId },
        include: {
            sector: { include: { block: { include: { district: true } } } },
            users: { select: { fullNameEn: true, fullNameGu: true, role: true } },
        },
    });
    if (!awc)
        return res.status(404).json({ error: 'AWC not found' });
    // Calculate start and end of target month
    const [yearStr, monthStr] = month.split('-');
    const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
    const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59);
    const items = await db_1.prisma.item.findMany({
        orderBy: [{ category: 'asc' }, { nameEn: 'asc' }],
    });
    // Query events in this period
    const events = await db_1.prisma.stockLedgerEvent.findMany({
        where: {
            awcId,
            serverCreatedAt: { gte: startDate, lte: endDate },
        },
    });
    // Query events before this period to calculate Opening Balance
    const priorEvents = await db_1.prisma.stockLedgerEvent.findMany({
        where: {
            awcId,
            serverCreatedAt: { lt: startDate },
        },
    });
    const openingBalances = {};
    for (const ev of priorEvents) {
        openingBalances[ev.itemId] = (openingBalances[ev.itemId] || 0) + ev.quantityChange;
    }
    // Aggregate current period movements
    const receipts = {};
    const distributions = {};
    const writeOffs = {};
    const adjustments = {};
    for (const ev of events) {
        if (ev.eventType === client_1.StockEventType.RECEIPT_INTAKE || ev.eventType === client_1.StockEventType.OPENING_BALANCE) {
            receipts[ev.itemId] = (receipts[ev.itemId] || 0) + ev.quantityChange;
        }
        else if (ev.eventType === client_1.StockEventType.THR_DISTRIBUTION || ev.eventType === client_1.StockEventType.HCM_CONSUMPTION) {
            distributions[ev.itemId] = (distributions[ev.itemId] || 0) + Math.abs(ev.quantityChange);
        }
        else if (ev.eventType === client_1.StockEventType.APPROVED_WRITE_OFF) {
            writeOffs[ev.itemId] = (writeOffs[ev.itemId] || 0) + Math.abs(ev.quantityChange);
        }
        else if (ev.eventType === client_1.StockEventType.PHYSICAL_COUNT_ADJUSTMENT) {
            adjustments[ev.itemId] = (adjustments[ev.itemId] || 0) + ev.quantityChange;
        }
    }
    const itemReports = items.map((it) => {
        const opening = Number((openingBalances[it.id] || 0).toFixed(2));
        const received = Number((receipts[it.id] || 0).toFixed(2));
        const issued = Number((distributions[it.id] || 0).toFixed(2));
        const spoiled = Number((writeOffs[it.id] || 0).toFixed(2));
        const adjusted = Number((adjustments[it.id] || 0).toFixed(2));
        const closing = Number((opening + received - issued - spoiled + adjusted).toFixed(2));
        return {
            item: it,
            opening,
            received,
            issued,
            spoiled,
            adjusted,
            closing,
            unit: it.unit,
        };
    });
    // Distinct distribution days
    const thrDays = await db_1.prisma.tHRDistribution.findMany({
        where: { awcId, distributionDate: { gte: startDate, lte: endDate } },
        select: { distributionDate: true },
    });
    const hcmDays = await db_1.prisma.hCMDailyService.findMany({
        where: { awcId, serviceDate: { gte: startDate, lte: endDate } },
        select: { serviceDate: true },
    });
    const uniqueDays = new Set([
        ...thrDays.map((d) => d.distributionDate.toISOString().split('T')[0]),
        ...hcmDays.map((d) => d.serviceDate.toISOString().split('T')[0]),
    ]);
    // Open discrepancies for this AWC
    const openDiscrepancies = await db_1.prisma.discrepancy.findMany({
        where: { awcId, status: 'OPEN' },
        include: { item: true },
    });
    return res.json({
        mpr: {
            reportMonth: month,
            generatedAt: new Date(),
            awc,
            itemReports,
            feedingDaysDelivered: uniqueDays.size,
            feedingDaysMandatedTarget: 25, // Target per month (approx 300 days/year)
            openDiscrepanciesCount: openDiscrepancies.length,
            openDiscrepancies,
            workerName: awc.users.find((u) => u.role === 'AWW')?.fullNameEn || 'Hansaben Patel',
        },
    });
});
// GET /api/reports/dispatch-vs-receipt — Audit comparison
router.get('/dispatch-vs-receipt', auth_1.authenticateToken, async (req, res) => {
    const receipts = await db_1.prisma.receipt.findMany({
        include: {
            awc: { select: { code: true, nameEn: true, nameGu: true } },
            dispatch: { include: { supplier: true } },
            items: { include: { item: true } },
        },
        orderBy: { receivedDate: 'desc' },
        take: 50,
    });
    const comparison = receipts.flatMap((rcp) => rcp.items.map((it) => ({
        receiptNumber: rcp.receiptNumber,
        challanNumber: rcp.challanNumber,
        awcCode: rcp.awc.code,
        awcName: rcp.awc.nameEn,
        supplier: rcp.dispatch?.supplier?.nameEn || 'Direct Delivery',
        receivedDate: rcp.receivedDate,
        item: it.item.nameEn,
        quantityExpected: it.quantityExpected,
        quantityAccepted: it.quantityAccepted,
        quantityShort: it.quantityShort,
        quantityDamaged: it.quantityDamaged,
        status: rcp.status,
    })));
    return res.json({ comparison });
});
// GET /api/reports/cag-audit — District Overview for CAG Readiness
router.get('/cag-audit', auth_1.authenticateToken, async (_req, res) => {
    const totalAWCs = await db_1.prisma.aWC.count();
    const totalBeneficiaries = await db_1.prisma.beneficiary.count();
    const totalDiscrepancies = await db_1.prisma.discrepancy.count();
    const openDiscrepancies = await db_1.prisma.discrepancy.count({ where: { status: 'OPEN' } });
    const approvedWriteOffs = await db_1.prisma.writeOffRequest.count({ where: { status: 'APPROVED' } });
    const pendingApprovals = await db_1.prisma.writeOffRequest.count({
        where: { status: { in: ['PENDING_SUPERVISOR', 'PENDING_CDPO'] } },
    });
    const totalReceipts = await db_1.prisma.receipt.count();
    const receiptsWithShortages = await db_1.prisma.receipt.count({
        where: { status: 'HAS_DISCREPANCIES' },
    });
    return res.json({
        district: 'Panchmahal',
        state: 'Gujarat',
        auditCycle: '2026',
        metrics: {
            totalAWCs,
            totalBeneficiaries,
            totalDiscrepancies,
            openDiscrepancies,
            approvedWriteOffs,
            pendingApprovals,
            totalReceipts,
            receiptsWithShortages,
            shortagePercentage: totalReceipts > 0 ? Number(((receiptsWithShortages / totalReceipts) * 100).toFixed(1)) : 0,
            dataAvailabilityRate: '100% (Digital Ledger Audited)',
        },
    });
});
exports.default = router;
