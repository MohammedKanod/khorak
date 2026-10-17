import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { db, OutboxOperation } from '../../db/offlineDb';
import { ModalWrapper } from '../ModalWrapper';
import confetti from 'canvas-confetti';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface SyncCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncCentreModal: React.FC<SyncCentreModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, t } = useLanguage();
  const { isOnline, isSyncing, pendingCount, syncNow, lastSyncTime } = useOffline();

  const [pendingOps, setPendingOps] = useState<OutboxOperation[]>([]);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    async function loadPending() {
      try {
        const ops = await db.outbox.orderBy('clientCreatedAt').toArray();
        setPendingOps(ops);
      } catch (err) {
        console.error('Failed to load pending outbox:', err);
      }
    }
    loadPending();
  }, [isOpen, pendingCount, isSyncing]);

  const handleTriggerSync = async () => {
    setSyncStatusMsg('');
    try {
      await syncNow();
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      setSyncStatusMsg(
        language === 'gu'
          ? 'સમન્વયન (Sync) સફળતાપૂર્વક સંપન્ન થયું!'
          : 'Sync completed successfully!'
      );
    } catch (err: any) {
      setSyncStatusMsg(err.message || 'Sync failed');
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'gu' ? 'સમન્વય કેન્દ્ર (Sync Centre)' : 'Sync Centre'}
      subtitle={
        language === 'gu'
          ? 'ઑફલાઇન ડેટા સર્વર સાથે મોકલવો અને ચકાસણી'
          : 'Offline storage outbox and server synchronization'
      }
      englishTitle="SYNC CENTRE"
      icon={RefreshCw}
      iconColor="text-pastel-violetIcon"
      bgColor="bg-pastel-violet"
      borderColor="border-[#C1B4FA]"
      maxWidth="3xl"
      footerActions={
        <div className="w-full flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition active:scale-95"
          >
            {language === 'gu' ? 'બંધ કરો' : 'Close'}
          </button>

          <button
            type="button"
            disabled={!isOnline || isSyncing}
            onClick={handleTriggerSync}
            className={`px-6 py-2 rounded-xl text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center space-x-2 ${
              isSyncing
                ? 'bg-indigo-400 cursor-not-allowed'
                : !isOnline
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-indigo-700 hover:bg-indigo-800'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing
                ? language === 'gu'
                  ? 'સિંક થાય છે...'
                  : 'Syncing...'
                : language === 'gu'
                ? 'હવે સિંક કરો (Sync Now)'
                : 'Sync Now'}
            </span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status Hero Card */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            !isOnline
              ? 'bg-amber-50 border-amber-200'
              : pendingCount > 0
              ? 'bg-indigo-50 border-indigo-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                !isOnline
                  ? 'bg-amber-100 text-amber-800'
                  : pendingCount > 0
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {!isOnline ? (
                <WifiOff className="w-5 h-5" />
              ) : isSyncing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Wifi className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-sm font-black text-brand-navy">
                {!isOnline
                  ? language === 'gu'
                    ? 'ઑફલાઇન મોડ સક્રિય'
                    : 'Offline Mode Active'
                  : isSyncing
                  ? language === 'gu'
                    ? 'સર્વર સાથે સિંક થઈ રહ્યું છે...'
                    : 'Syncing with central server...'
                  : pendingCount > 0
                  ? `${pendingCount} ${language === 'gu' ? 'રેકોર્ડ મોકલવાના બાકી' : 'records waiting to sync'}`
                  : language === 'gu'
                  ? 'બધો ડેટા સર્વર સાથે સિંક છે'
                  : 'All records synchronized'}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {language === 'gu' ? 'છેલ્લું સિંક:' : 'Last sync:'}{' '}
                <span className="font-semibold text-slate-800">
                  {lastSyncTime
                    ? new Date(lastSyncTime).toLocaleTimeString('gu-IN')
                    : language === 'gu'
                    ? 'હમણાં જ'
                    : 'Just now'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${
                !isOnline
                  ? 'bg-amber-200 text-amber-950'
                  : pendingCount > 0
                  ? 'bg-indigo-200 text-indigo-950'
                  : 'bg-emerald-200 text-emerald-950'
              }`}
            >
              {pendingCount} {language === 'gu' ? 'બાકી' : 'Pending'}
            </span>
          </div>
        </div>

        {syncStatusMsg && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        )}

        {/* Pending Outbox Queue */}
        <div className="space-y-2">
          <div className="text-xs font-black text-brand-navy flex items-center justify-between">
            <span>
              {language === 'gu'
                ? 'સ્થાનિક રીતે સાચવેલ વ્યવહારો (Outbox Queue):'
                : 'Locally Saved Outbox Records:'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              IndexedDB · Dexie
            </span>
          </div>

          {pendingOps.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
              <div>
                {language === 'gu'
                  ? 'કોઈ પેન્ડિંગ ડેટા નથી. તમારો ફોન અને સર્વર સંપૂર્ણ મેળમાં છે.'
                  : 'No pending records in outbox. Everything is in sync.'}
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {pendingOps.map((op) => (
                <div
                  key={op.id}
                  className="p-3 bg-[#F7F4FF] rounded-xl border border-[#DDD5FC] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-brand-navy">
                      {op.type}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(op.clientCreatedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 flex-shrink-0">
                    {language === 'gu' ? 'મોબાઇલમાં સાચવ્યું' : 'Saved on device'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};
