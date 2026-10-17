"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerService = void 0;
const client_1 = require("@prisma/client");
const db_1 = require("../db");
class LedgerService {
    /**
     * Computes authoritative current stock balance for an AWC and Item directly from ledger events.
     */
    static async getItemBalance(awcId, itemId, tx = db_1.prisma) {
        const aggregate = await tx.stockLedgerEvent.aggregate({
            where: {
                awcId,
                itemId,
            },
            _sum: {
                quantityChange: true,
            },
        });
        return aggregate._sum.quantityChange || 0;
    }
    /**
     * Computes stock overview for all items at an AWC with runout estimations.
     */
    static async getAWCStockOverview(awcId) {
        const items = await db_1.prisma.item.findMany({
            orderBy: [{ category: 'asc' }, { nameEn: 'asc' }],
        });
        // Group sum of all ledger events by itemId for this AWC
        const stockEvents = await db_1.prisma.stockLedgerEvent.findMany({
            where: { awcId },
            orderBy: { serverCreatedAt: 'asc' },
        });
        const balancesByItem = {};
        for (const ev of stockEvents) {
            if (!balancesByItem[ev.itemId]) {
                balancesByItem[ev.itemId] = { balance: 0 };
            }
            balancesByItem[ev.itemId].balance += ev.quantityChange;
            balancesByItem[ev.itemId].lastDate = ev.serverCreatedAt;
        }
        // Calculate rolling consumption rate (last 30 days) to compute estimated days of stock remaining
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const consumptionEvents = await db_1.prisma.stockLedgerEvent.findMany({
            where: {
                awcId,
                serverCreatedAt: { gte: thirtyDaysAgo },
                eventType: { in: [client_1.StockEventType.THR_DISTRIBUTION, client_1.StockEventType.HCM_CONSUMPTION] },
            },
        });
        const consumptionByItem = {};
        for (const ev of consumptionEvents) {
            consumptionByItem[ev.itemId] = (consumptionByItem[ev.itemId] || 0) + Math.abs(ev.quantityChange);
        }
        return items.map((item) => {
            const balance = Number((balancesByItem[item.id]?.balance || 0).toFixed(2));
            const totalConsumed30d = consumptionByItem[item.id] || 0;
            const dailyConsumption = totalConsumed30d > 0 ? totalConsumed30d / 30 : 0;
            let daysRemaining = null;
            let stockStatus = 'ADEQUATE';
            if (dailyConsumption > 0) {
                daysRemaining = Math.max(0, Math.floor(balance / dailyConsumption));
                if (daysRemaining <= 3) {
                    stockStatus = 'CRITICAL';
                }
                else if (daysRemaining <= item.minStockThresholdDays) {
                    stockStatus = 'LOW';
                }
                else if (daysRemaining > 20) {
                    stockStatus = 'FULL';
                }
                else {
                    stockStatus = 'ADEQUATE';
                }
            }
            else {
                // If insufficient history, judge by balance vs typical threshold
                if (balance <= 5)
                    stockStatus = 'CRITICAL';
                else if (balance <= 15)
                    stockStatus = 'LOW';
                else
                    stockStatus = 'ADEQUATE';
            }
            return {
                item,
                currentBalance: balance,
                unit: item.unit,
                daysRemaining,
                stockStatus,
                lastMovementDate: balancesByItem[item.id]?.lastDate || null,
            };
        });
    }
    /**
     * Appends an immutable stock event inside a database transaction.
     * Calculates new balance and validates against negative balances.
     */
    static async recordMovement(params, tx = db_1.prisma) {
        const currentBalance = await this.getItemBalance(params.awcId, params.itemId, tx);
        const newBalance = Number((currentBalance + params.quantityChange).toFixed(3));
        if (newBalance < 0 && !params.allowNegative) {
            throw new Error(`Insufficient stock for item. Available: ${currentBalance} ${params.unit}, Requested: ${Math.abs(params.quantityChange)} ${params.unit}`);
        }
        const event = await tx.stockLedgerEvent.create({
            data: {
                awcId: params.awcId,
                itemId: params.itemId,
                batchNumber: params.batchNumber,
                eventType: params.eventType,
                quantityChange: params.quantityChange,
                balanceAfter: newBalance,
                unit: params.unit,
                referenceType: params.referenceType,
                referenceId: params.referenceId,
                actorUserId: params.actorUserId,
                clientOperationId: params.clientOperationId,
                clientCreatedAt: params.clientCreatedAt,
                reasonNote: params.reasonNote,
            },
        });
        // Check if stock became critical / low, and emit an alert if so
        if (newBalance <= 10 && params.quantityChange < 0) {
            const item = await tx.item.findUnique({ where: { id: params.itemId } });
            if (item) {
                await tx.alert.create({
                    data: {
                        recipientRole: client_1.Role.SUPERVISOR,
                        awcId: params.awcId,
                        alertType: 'LOW_STOCK_RUNOUT',
                        severity: newBalance <= 5 ? client_1.SeverityLevel.CRITICAL : client_1.SeverityLevel.HIGH,
                        titleEn: `Low Stock: ${item.nameEn}`,
                        titleGu: `સ્ટોક અછત: ${item.nameGu}`,
                        messageEn: `Stock for ${item.nameEn} reached ${newBalance} ${item.unit}. Please arrange replenishment.`,
                        messageGu: `${item.nameGu} નો સ્ટોક ${newBalance} ${item.unit} થયો છે. તાત્કાલિક પુરવઠો મોકલવા વિનંતી.`,
                        linkRoute: '/stock',
                    },
                });
            }
        }
        return event;
    }
}
exports.LedgerService = LedgerService;
