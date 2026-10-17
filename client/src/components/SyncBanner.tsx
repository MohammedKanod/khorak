import React from 'react';
import { useOffline } from '../context/OfflineContext';
import { useLanguage } from '../context/LanguageContext';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const SyncBanner: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, conflictCount, syncNow, lastSyncTime } = useOffline();
  const { t } = useLanguage();

  if (isOnline && pendingCount === 0 && conflictCount === 0) {
    return null;
  }

  return (
    <div
      className={`border-b text-xs font-medium px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm transition ${
        !isOnline
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : conflictCount > 0
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-saffron-50 border-saffron-200 text-saffron-900'
      }`}
    >
      <div className="flex items-center space-x-2">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
        ) : conflictCount > 0 ? (
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
        ) : (
          <RefreshCw className="w-4 h-4 text-saffron-600 flex-shrink-0 animate-spin" />
        )}
        <span>
          {!isOnline
            ? t('syncOfflineNotice')
            : conflictCount > 0
            ? `${conflictCount} operations flagged for review.`
            : `${pendingCount} entries saved locally on this device. Ready to synchronize.`}
        </span>
      </div>

      <div className="flex items-center space-x-3 ml-auto">
        {lastSyncTime && (
          <span className="text-[11px] opacity-75 hidden sm:inline">
            Last synced: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        {isOnline && (
          <button
            onClick={() => syncNow()}
            disabled={isSyncing}
            className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md font-bold text-slate-800 shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t('syncSyncing') : t('syncNow')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
