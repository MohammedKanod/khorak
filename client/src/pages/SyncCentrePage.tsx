import React, { useState } from 'react';
import { useOffline } from '../context/OfflineContext';
import { useLanguage } from '../context/LanguageContext';
import { SectionHeader } from '../components/SectionHeader';
import { SyncCentreModal } from '../components/modals/SyncCentreModal';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  ArrowRight,
} from 'lucide-react';

export const SyncCentrePage: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    conflictCount,
    lastSyncTime,
    pendingOperations,
    syncNow,
  } = useOffline();
  const { t, language } = useLanguage();

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-cream-100 select-none">
      {/* SECTION HEADER (Pastel Violet) */}
      <SectionHeader
        title={language === 'gu' ? 'સિંક કેન્દ્ર' : 'Sync Centre'}
        englishTitle="OFFLINE-FIRST OUTBOX & SYNC"
        icon={RefreshCw}
        bgColor="bg-pastel-violet"
        borderColor="border-[#C1B4FA]"
        iconColor="text-pastel-violetIcon"
        actionButton={
          <button
            type="button"
            onClick={() => {
              if (pendingCount > 0) syncNow();
              setIsSyncModalOpen(true);
            }}
            disabled={isSyncing}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-pastel-violet hover:bg-pastel-violetHover border-2 border-[#C1B4FA] text-pastel-violetIcon font-black text-xs transition active:scale-95 flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 stroke-[2.2] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'સિંક થઈ રહ્યું છે...' : 'હમણાં સિંક કરો'}</span>
          </button>
        }
      />

      {/* SECTION CONTENT: Metrics and Outbox Queue */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                isOnline
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {isOnline ? (
                <Wifi className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <WifiOff className="w-5 h-5 stroke-[2.2]" />
              )}
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'ઇન્ટરનેટ સ્થિતિ' : 'Network'}
              </div>
              <div
                className={`text-xs sm:text-sm font-black ${
                  isOnline ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {isOnline ? 'ઓનલાઇન (જોડાયેલ)' : 'ઑફલાઇન (સ્થાનિક મોડ)'}
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-violet/60 border border-[#C1B4FA] text-pastel-violetIcon flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'પેન્ડિંગ આઉટબોક્સ' : 'Pending in Queue'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                {pendingCount} ઓપરેશન
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-mint/60 border border-[#8CEFDA] text-pastel-mintIcon flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'સ્થાનિક સ્ટોરેજ' : 'IndexedDB'}
              </div>
              <div className="text-xs sm:text-sm font-black text-brand-navy">
                સુરક્ષિત (Encrypted)
              </div>
            </div>
          </div>
        </div>

        {/* Pending Operations Queue List */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E0D5C3] mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-brand-navy font-sans">
                {language === 'gu' ? 'ઑફલાઇન કતાર (IndexedDB Outbox Queue)' : 'Offline Local Storage Queue'}
              </h2>
              <p className="text-xs text-brand-navy/60 mt-0.5">
                ઇન્ટરનેટ જોડાણ મળતાં જ આ ઓપરેશન્સ આપોઆપ સર્વર સાથે સિંક થશે
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="text-xs font-black text-pastel-violetIcon hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>સિંક વિગત પોપઅપ</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>

          {pendingCount === 0 ? (
            <div className="p-6 text-center rounded-xl bg-pastel-violet/30 border-2 border-dashed border-[#C1B4FA] my-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 stroke-[2.2]" />
              <div className="text-sm font-black text-brand-navy">
                બધા રેકોર્ડ્સ સર્વર સાથે સિંક છે!
              </div>
              <div className="text-xs text-brand-navy/60 mt-0.5">
                સ્થાનિક ડેટાબેઝમાં કોઈ પેન્ડિંગ ઓપરેશન નથી.
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingOperations.map((op: any) => (
                <div
                  key={op.id}
                  onClick={() => setIsSyncModalOpen(true)}
                  className="p-3.5 rounded-xl bg-[#FFFDF9] border-2 border-[#E0D5C3] hover:border-[#C1B4FA] transition shadow-2xs cursor-pointer group flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-pastel-violet text-pastel-violetIcon border border-[#C1B4FA]">
                        {op.type}
                      </span>
                      <span className="text-xs font-black text-brand-navy">
                        #{op.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="text-[11px] text-brand-navy/60">
                      સમય: {new Date(op.createdAt).toLocaleTimeString('gu-IN')} · પ્રયત્ન: {op.retryCount}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    કતારમાં છે (Pending)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* POPUP: SyncCentreModal with clear distributive violet border */}
      <SyncCentreModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
};
