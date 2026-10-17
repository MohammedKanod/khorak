"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const db_1 = require("../db");
class AuditService {
    static async log(params, tx = db_1.prisma) {
        try {
            return await tx.auditLog.create({
                data: {
                    actorUserId: params.actorUserId,
                    actorRole: params.actorRole,
                    awcId: params.awcId,
                    entityType: params.entityType,
                    entityId: params.entityId,
                    action: params.action,
                    oldValueJson: params.oldValue ? JSON.stringify(params.oldValue) : null,
                    newValueJson: params.newValue ? JSON.stringify(params.newValue) : null,
                    reasonCode: params.reasonCode,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                    timestamp: new Date(),
                },
            });
        }
        catch (err) {
            console.error('Failed to write audit log:', err);
        }
    }
}
exports.AuditService = AuditService;
