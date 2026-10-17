import Dexie, { Table } from 'dexie';

export interface OutboxOperation {
  id?: number;
  operationId: string;
  type: 'RECEIPT_VERIFY' | 'THR_DISTRIBUTE' | 'HCM_SERVICE' | 'PHYSICAL_COUNT' | 'WRITE_OFF';
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'PROCESSED' | 'FAILED' | 'CONFLICT';
  clientCreatedAt: string;
  retryCount: number;
  errorMessage?: string;
}

export interface CachedStockItem {
  id: string;
  itemId: string;
  nameEn: string;
  nameGu: string;
  category: string;
  unit: string;
  currentBalance: number;
  stockStatus: string;
  daysRemaining?: number | null;
  cachedAt: string;
}

export class KhorakOfflineDatabase extends Dexie {
  outbox!: Table<OutboxOperation, number>;
  cachedStock!: Table<CachedStockItem, string>;

  constructor() {
    super('KhorakOfflineDB');
    this.version(1).stores({
      outbox: '++id, operationId, type, status, clientCreatedAt',
      cachedStock: 'id, itemId, category, stockStatus',
    });
  }
}

export const db = new KhorakOfflineDatabase();

/**
 * Enqueues an offline-first operation into Dexie outbox
 */
export async function enqueueOfflineOperation(
  type: OutboxOperation['type'],
  payload: any
): Promise<string> {
  const operationId = crypto.randomUUID();
  const clientCreatedAt = new Date().toISOString();

  await db.outbox.add({
    operationId,
    type,
    payload,
    status: 'PENDING',
    clientCreatedAt,
    retryCount: 0,
  });

  return operationId;
}

/**
 * Flush all pending outbox operations to server /api/sync/batch
 */
export async function flushOutboxQueue(token: string) {
  const pending = await db.outbox
    .where('status')
    .equals('PENDING')
    .toArray();

  if (pending.length === 0) return { processed: 0, duplicate: 0, conflict: 0 };

  // Mark syncing
  await db.outbox
    .where('id')
    .anyOf(pending.map((p) => p.id!))
    .modify({ status: 'SYNCING' });

  try {
    const response = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        operations: pending.map((p) => ({
          operationId: p.operationId,
          type: p.type,
          payload: p.payload,
          clientCreatedAt: p.clientCreatedAt,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed with HTTP status ${response.status}`);
    }

    const data = await response.json();

    // Update statuses based on server feedback
    for (const res of data.results) {
      const match = pending.find((p) => p.operationId === res.operationId);
      if (match && match.id) {
        if (res.status === 'PROCESSED' || res.status === 'DUPLICATE_IGNORED') {
          await db.outbox.update(match.id, {
            status: 'PROCESSED',
          });
        } else if (res.status === 'CONFLICT_FLAGGED') {
          await db.outbox.update(match.id, {
            status: 'CONFLICT',
            errorMessage: res.error,
          });
        }
      }
    }

    return data.summary;
  } catch (err: any) {
    // Revert to pending on network failure
    await db.outbox
      .where('id')
      .anyOf(pending.map((p) => p.id!))
      .modify((item) => {
        item.status = 'PENDING';
        item.retryCount += 1;
        item.errorMessage = err.message;
      });
    throw err;
  }
}
