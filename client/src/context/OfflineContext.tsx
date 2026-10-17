import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, flushOutboxQueue, OutboxOperation } from '../db/offlineDb';
import { useAuth } from './AuthContext';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictCount: number;
  lastSyncTime: Date | null;
  pendingOperations: OutboxOperation[];
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('khorak_last_sync');
    return saved ? new Date(saved) : null;
  });

  // Reactive live query to Dexie outbox
  const outboxItems = useLiveQuery(() => db.outbox.toArray(), []) || [];

  const pendingOperations = outboxItems.filter((op) => op.status === 'PENDING' || op.status === 'SYNCING');
  const pendingCount = pendingOperations.length;
  const conflictCount = outboxItems.filter((op) => op.status === 'CONFLICT').length;

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-flush outbox queue when connectivity is restored
      if (token && pendingCount > 0) {
        syncNow();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token, pendingCount]);

  const syncNow = async () => {
    if (!token || isSyncing) return;
    setIsSyncing(true);
    try {
      await flushOutboxQueue(token);
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem('khorak_last_sync', now.toISOString());
    } catch (err) {
      console.error('Manual sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        conflictCount,
        lastSyncTime,
        pendingOperations,
        syncNow,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};
