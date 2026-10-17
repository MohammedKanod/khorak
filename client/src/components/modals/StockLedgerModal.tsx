import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ModalWrapper } from '../ModalWrapper';
import {
  BookOpen,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface StockLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockLedgerModal: React.FC<StockLedgerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, apiFetch } = useAuth();
  const { language, t } = useLanguage();

  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;

  useEffect(() => {
    if (!isOpen || !user?.awcId) return;

    async function loadLedger() {
      if (!user?.awcId) return;
      try {
        setLoading(true);
        const url = `/api/stock/ledger/awc/${user.awcId}?page=${page}&limit=${limit}${
          filterType !== 'ALL' ? `&type=${filterType}` : ''
        }`;
        const res = await apiFetch(url);
        setLedgerEntries(res.entries || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load stock ledger:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLedger();
  }, [isOpen, user, page, filterType]);

  const getMovementBadge = (type: string, qty: number) => {
    if (type === 'RECEIPT' || qty > 0) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
          <span>+{qty}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
        <ArrowUpRight className="w-3 h-3 text-rose-600" />
        <span>{qty}</span>
      </span>
    );
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'gu' ? 'સ્ટોક નોંધપોથી (લેજર)' : 'Stock Ledger'}
      subtitle={
        language === 'gu'
          ? 'તમામ આવક, વિતરણ, ભોજન અને નુકસાનની ક્રમબદ્ધ નોંધણી'
          : 'Immutable audit trail of all stock movements'
      }
      englishTitle="STOCK LEDGER"
      icon={BookOpen}
      iconColor="text-pastel-yellowIcon"
      bgColor="bg-pastel-yellow"
      borderColor="border-[#FDEE72]"
      maxWidth="3xl"
      footerActions={
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {language === 'gu'
                ? 'નોંધપોથી સુરક્ષિત અને અપરિવર્તનીય (Immutable) છે'
                : 'Ledger records are digitally secured'}
            </span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Filter bar */}
        <div className="flex items-center space-x-1 p-1 bg-[#FFFDE8] rounded-xl border border-[#FBEA8C] shadow-xs self-start overflow-x-auto max-w-full">
          {[
            { id: 'ALL', labelGu: 'બધા વ્યવહારો', labelEn: 'All Movements' },
            { id: 'RECEIPT', labelGu: 'આવક (Receipt)', labelEn: 'Receipts' },
            { id: 'DISTRIBUTION', labelGu: 'THR વિતરણ', labelEn: 'THR Distribution' },
            { id: 'CONSUMPTION', labelGu: 'ગરમ ભોજન', labelEn: 'HCM Consumption' },
            { id: 'WRITE_OFF', labelGu: 'બગાડ / નુકસાન', labelEn: 'Write-Offs' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilterType(f.id);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                filterType === f.id
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'gu' ? f.labelGu : f.labelEn}
            </button>
          ))}
        </div>

        {/* Ledger Entries List */}
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500 font-bold">
            {language === 'gu' ? 'નોંધપોથી લોડ થઈ રહી છે...' : 'Loading ledger...'}
          </div>
        ) : ledgerEntries.length === 0 ? (
          <div className="p-6 bg-[#FFFDE8] rounded-2xl border border-[#FBEA8C] text-center text-xs text-slate-500">
            {language === 'gu'
              ? 'આ કેટેગરીમાં કોઈ એન્ટ્રી નથી.'
              : 'No ledger records found.'}
          </div>
        ) : (
          <div className="space-y-2">
            {ledgerEntries.map((e) => {
              const dt = new Date(e.createdAt || e.transactionDate).toLocaleDateString('gu-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={e.id}
                  className="p-3 bg-[#FFFDE8] rounded-2xl border border-[#FBEA8C] shadow-xs flex items-center justify-between gap-3 hover:bg-[#FFF8C4] transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-brand-navy truncate">
                        {e.item
                          ? language === 'gu'
                            ? e.item.nameGu
                            : e.item.nameEn
                          : 'Ration Item'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        · {e.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {dt} · {e.notes || e.referenceType || 'રૂટીન વ્યવહાર'}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div>{getMovementBadge(e.type, e.quantity)}</div>
                    <div className="text-[10px] text-slate-500 font-bold mt-1">
                      {language === 'gu' ? 'બાકી:' : 'Balance:'}{' '}
                      <span className="font-mono text-brand-navy">{e.balanceAfter}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
