import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SectionHeader } from '../components/SectionHeader';
import { StockLedgerModal } from '../components/modals/StockLedgerModal';
import {
  BookOpen,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

export const StockLedgerPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();

  const [ledgerEvents, setLedgerEvents] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user?.awcId) return;
    try {
      setLoading(true);
      const [itemsRes, ledgerRes] = await Promise.all([
        apiFetch('/api/items'),
        apiFetch(`/api/stock/ledger/${user.awcId}?limit=100`),
      ]);
      setItems(itemsRes.items || []);
      setLedgerEvents(ledgerRes.events || []);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filteredEvents = ledgerEvents.filter((ev) => {
    if (selectedEventType === 'ALL') return true;
    return ev.eventType === selectedEventType;
  });

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'RECEIPT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-pastel-pink text-pastel-pinkIcon border border-[#F8B4BA]">
            <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
            <span>આવક (RECEIPT)</span>
          </span>
        );
      case 'THR_DISTRIBUTION':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-pastel-peach text-pastel-peachIcon border border-[#FDC58A]">
            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
            <span>THR વિતરણ</span>
          </span>
        );
      case 'HCM_CONSUMPTION':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-pastel-cyan text-pastel-cyanIcon border border-[#98EDE4]">
            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
            <span>ગરમ ભોજન વપરાશ</span>
          </span>
        );
      case 'WRITE_OFF':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-pastel-purple text-pastel-purpleIcon border border-[#F4A9EE]">
            <span>બગાડ / નુકસાન</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-cream-100 select-none">
      {/* SECTION HEADER (Pastel Yellow) */}
      <SectionHeader
        title={language === 'gu' ? 'સ્ટોક નોંધપોથી' : 'Stock Ledger'}
        englishTitle="STOCK LEDGER & AUDIT TRAIL"
        icon={BookOpen}
        bgColor="bg-pastel-yellow"
        borderColor="border-[#FDEE72]"
        iconColor="text-pastel-yellowIcon"
        actionButton={
          <button
            type="button"
            onClick={() => setIsLedgerModalOpen(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-pastel-yellow hover:bg-pastel-yellowHover border-2 border-[#FDEE72] text-pastel-yellowIcon font-black text-xs transition active:scale-95 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <BookOpen className="w-4 h-4 stroke-[2.2]" />
            <span>{language === 'gu' ? 'વિગતવાર પોપઅપ' : 'Inspect Ledger'}</span>
          </button>
        }
      />

      {/* SECTION CONTENT: Metrics, Filter Tabs, and Event List */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-yellow/60 border border-[#FDEE72] text-pastel-yellowIcon flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'કુલ વ્યવહારો' : 'Total Transactions'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                {ledgerEvents.length} એન્ટ્રી
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-pink/60 border border-[#F8B4BA] text-pastel-pinkIcon flex items-center justify-center flex-shrink-0">
              <ArrowDownRight className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'આવક એન્ટ્રીઓ' : 'Receipt Events'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                {ledgerEvents.filter((e) => e.eventType === 'RECEIPT').length}
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-peach/60 border border-[#FDC58A] text-pastel-peachIcon flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'વિતરણ વ્યવહારો' : 'Distribution Events'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                {ledgerEvents.filter((e) => e.eventType === 'THR_DISTRIBUTION' || e.eventType === 'HCM_CONSUMPTION').length}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/90 p-3 sm:p-3.5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'બધા (All Events)' },
              { id: 'RECEIPT', label: 'આવક (Receipts)' },
              { id: 'THR_DISTRIBUTION', label: 'THR વિતરણ' },
              { id: 'HCM_CONSUMPTION', label: 'ગરમ ભોજન વપરાશ' },
              { id: 'WRITE_OFF', label: 'બગાડ / નુકસાન' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedEventType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex-shrink-0 border ${
                  selectedEventType === tab.id
                    ? 'bg-pastel-yellow text-brand-navy border-[#FDEE72] shadow-2xs'
                    : 'bg-[#FAF3E8] text-brand-navy/70 border-transparent hover:bg-cream-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E0D5C3] mb-3">
            <h2 className="text-sm sm:text-base font-black text-brand-navy font-sans">
              {language === 'gu' ? 'સ્ટોક મુવમેન્ટ હિસ્ટ્રી (ક્લિક કરી વિગત જુઓ)' : 'Stock Movement History (Tap to Inspect)'}
            </h2>
            <span className="text-xs font-bold text-brand-navy/60">
              {filteredEvents.length} રેકોર્ડ્સ
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs font-bold text-brand-navy/50">
              નોંધપોથી લોડ થઈ રહી છે...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-pastel-yellow/30 border-2 border-dashed border-[#FDEE72] my-2">
              <BookOpen className="w-8 h-8 text-pastel-yellowIcon mx-auto mb-2 stroke-[2.2]" />
              <div className="text-sm font-black text-brand-navy">
                કોઈ લેજર વ્યવહાર મળ્યો નથી.
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredEvents.map((ev) => {
                const isIncoming = ev.eventType === 'RECEIPT';
                return (
                  <div
                    key={ev.id}
                    onClick={() => setIsLedgerModalOpen(true)}
                    className="p-3.5 rounded-xl bg-[#FFFDF9] border-2 border-[#E0D5C3] hover:border-[#FDEE72] transition shadow-2xs cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          {getEventBadge(ev.eventType)}
                          <span className="text-xs font-black text-brand-navy">
                            {language === 'gu' ? ev.item?.nameGu : ev.item?.nameEn}
                          </span>
                        </div>
                        <div className="text-[11px] text-brand-navy/60 font-semibold mt-1 flex items-center space-x-2">
                          <span>{new Date(ev.timestamp).toLocaleDateString('gu-IN')}</span>
                          <span>·</span>
                          <span>રેફરન્સ: {ev.referenceId || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                      <div className="text-right">
                        <div
                          className={`text-sm font-black ${
                            isIncoming ? 'text-emerald-700' : 'text-brand-navy'
                          }`}
                        >
                          {isIncoming ? '+' : '-'}
                          {ev.quantity} {ev.item?.unit}
                        </div>
                        <div className="text-[10px] text-brand-navy/50 font-bold">
                          બાકી બેલેન્સ: {ev.balanceAfter} {ev.item?.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* POPUP: StockLedgerModal with clear distributive yellow border */}
      <StockLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
      />
    </div>
  );
};
