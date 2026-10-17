import { Role } from '@prisma/client';
import { prisma } from '../db';

export interface AuditParams {
  actorUserId: string;
  actorRole: Role;
  awcId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  reasonCode?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  static async log(params: AuditParams, tx: any = prisma) {
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
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
}
