import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ModalWrapper } from '../ModalWrapper';
import { StatusBadge } from '../StatusBadge';
import {
  Boxes,
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface StockOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLedger?: () => void;
}

export const StockOverviewModal: React.FC<StockOverviewModalProps> = ({
  isOpen,
  onClose,
  onOpenLedger,
}) => {
  const { user, apiFetch } = useAuth();
  const { language, t } = useLanguage();

  const [stockItems, setStockItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'THR' | 'HCM'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user?.awcId) return;

    async function loadStock() {
      if (!user?.awcId) return;
      try {
        setLoading(true);
        const res = await apiFetch(`/api/stock/awc/${user.awcId}`);
        setStockItems(res.stockOverview || []);
      } catch (err) {
        console.error('Failed to load stock overview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStock();
  }, [isOpen, user]);

  const filteredItems = stockItems.filter((s) => {
    const isThr = s.item.category === 'THR_PACKET';
    if (selectedFilter === 'THR' && !isThr) return false;
    if (selectedFilter === 'HCM' && isThr) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.item.nameGu?.includes(q) ||
      s.item.nameEn?.toLowerCase().includes(q) ||
      s.item.code?.toLowerCase().includes(q)
    );
  });

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'gu' ? 'વર્તમાન સ્ટોક સ્થિતિ' : 'Current Stock Balance'}
      subtitle={
        language === 'gu'
          ? 'આંગણવાડી કેન્દ્ર પર હાજર જથ્થો અને અનામત સ્થિતિ'
          : 'Live inventory balance at this Anganwadi Centre'
      }
      englishTitle="STOCK BALANCE"
      icon={Layers}
      iconColor="text-pastel-blueIcon"
      bgColor="bg-pastel-blue"
      borderColor="border-[#ADC4FA]"
      maxWidth="3xl"
      footerActions={
        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition active:scale-95"
          >
            {language === 'gu' ? 'બંધ કરો' : 'Close'}
          </button>

          {onOpenLedger && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLedger();
              }}
              className="px-4 py-2 rounded-xl bg-pastel-yellow hover:bg-pastel-yellowHover text-brand-navy border border-amber-300 text-xs font-black transition active:scale-95 flex items-center space-x-1"
            >
              <span>{language === 'gu' ? 'સ્ટોક નોંધપોથી જુઓ →' : 'View Stock Ledger →'}</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Segmented Filter */}
          <div className="flex items-center space-x-1 p-1 bg-[#EFF4FE] rounded-xl border border-[#C8D9FC] shadow-xs self-start">
            <button
              type="button"
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'gu' ? 'બધા' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('THR')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedFilter === 'THR'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'gu' ? 'THR રાશન' : 'THR'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('HCM')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedFilter === 'HCM'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'gu' ? 'ગરમ ભોજન (કાચો માલ)' : 'HCM Raw'}
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'gu' ? 'વસ્તુ શોધો...' : 'Search items...'
              }
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#C8D9FC] text-xs font-medium focus:ring-2 focus:ring-blue-400 bg-white"
            />
          </div>
        </div>

        {/* Stock Items Grid */}
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500 font-bold">
            {language === 'gu' ? 'સ્ટોક લોડ થઈ રહ્યો છે...' : 'Loading stock...'}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6 bg-[#EFF4FE] rounded-2xl border border-[#C8D9FC] text-center text-xs text-slate-500">
            {language === 'gu' ? 'કોઈ વસ્તુ મળી નથી.' : 'No items found.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((s) => {
              const isLow = s.currentBalance <= (s.item?.reorderLevel || 10);
              const isCritical = s.currentBalance === 0;

              return (
                <div
                  key={s.item.id}
                  className="p-3.5 rounded-2xl bg-[#EFF4FE] border border-[#C8D9FC] shadow-xs flex flex-col justify-between space-y-2 hover:bg-[#E3ECFD] transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-black text-brand-navy leading-snug">
                        {language === 'gu' ? s.item.nameGu : s.item.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {s.item.code}
                      </div>
                    </div>
                    {isCritical ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                        {language === 'gu' ? 'ખાલી' : 'Empty'}
                      </span>
                    ) : isLow ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900">
                        {language === 'gu' ? 'ઓછો સ્ટોક' : 'Low Stock'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        {language === 'gu' ? 'યોગ્ય' : 'Adequate'}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-[11px] font-medium text-slate-500">
                      {language === 'gu' ? 'હાજર જથ્થો:' : 'Available:'}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-black text-brand-navy">
                        {s.currentBalance}
                      </span>{' '}
                      <span className="text-xs font-bold text-slate-600">
                        {s.item.unit}
                      </span>
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
