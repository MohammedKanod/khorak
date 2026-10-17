import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SectionHeader } from '../components/SectionHeader';
import { PhysicalCountModal } from '../components/modals/PhysicalCountModal';
import {
  Scale,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const PhysicalCountPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();

  const [stockOverview, setStockOverview] = useState<any[]>([]);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStock = async () => {
    if (!user?.awcId) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/api/stock/awc/${user.awcId}`);
      setStockOverview(res.stockOverview || []);
    } catch (err) {
      console.error('Failed to load stock overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, [user]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-cream-100 select-none">
      {/* SECTION HEADER (Pastel Lime) */}
      <SectionHeader
        title={language === 'gu' ? 'ભૌતિક ગણતરી' : 'Physical Count'}
        englishTitle="PHYSICAL STOCK VERIFICATION"
        icon={Scale}
        bgColor="bg-pastel-lime"
        borderColor="border-[#B0F090]"
        iconColor="text-pastel-limeIcon"
        actionButton={
          <button
            type="button"
            onClick={() => setIsCountModalOpen(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-pastel-lime hover:bg-pastel-limeHover border-2 border-[#B0F090] text-pastel-limeIcon font-black text-xs transition active:scale-95 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <Scale className="w-4 h-4 stroke-[2.2]" />
            <span>{language === 'gu' ? '+ નવી ગણતરી કરો' : '+ Start Audit'}</span>
          </button>
        }
      />

      {/* SECTION CONTENT: Metrics and Items Physical Audit Checklist */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-lime/60 border border-[#B0F090] text-pastel-limeIcon flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'ચકાસાયેલ સામગ્રી' : 'Verified Items'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                {stockOverview.length} / {stockOverview.length}
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'મેળવણી સ્તર' : 'Match Accuracy'}
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-800">
                100% મેળવણી
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'છેલ્લો ઓડિટ' : 'Last Audited'}
              </div>
              <div className="text-xs sm:text-sm font-black text-brand-navy">
                ઓક્ટોબર 2026
              </div>
            </div>
          </div>
        </div>

        {/* Physical Stock Audit List */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E0D5C3] mb-3">
            <h2 className="text-sm sm:text-base font-black text-brand-navy font-sans">
              {language === 'gu' ? 'ગોડાઉન સ્ટોક ચકાસણી પત્રક' : 'On-Ground Physical Stock Checklist'}
            </h2>
            <span className="text-xs font-bold text-brand-navy/60">
              {stockOverview.length} આઇટમ
            </span>
          </div>

          <div className="space-y-3">
            {stockOverview.map((item) => (
              <div
                key={item.id}
                onClick={() => setIsCountModalOpen(true)}
                className="p-3.5 sm:p-4 rounded-xl bg-[#FFFDF9] border-2 border-[#E0D5C3] hover:border-[#B0F090] transition shadow-2xs cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-brand-navy/60 uppercase">
                      {item.item?.code}
                    </span>
                    <span className="text-sm font-black text-brand-navy">
                      {language === 'gu' ? item.item?.nameGu : item.item?.nameEn}
                    </span>
                  </div>
                  <div className="text-xs text-brand-navy/60 font-semibold mt-1">
                    વર્ગ: {item.item?.category} · યુનિટ: {item.item?.unit}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-brand-navy/60 font-bold block">ચોપડે સ્ટોક (Book Balance):</span>
                    <span className="text-base font-black text-brand-navy">
                      {item.currentBalance} {item.item?.unit}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCountModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-pastel-lime hover:bg-pastel-limeHover text-pastel-limeIcon font-black text-xs border border-[#B0F090] transition active:scale-95 flex items-center space-x-1 shadow-2xs group-hover:scale-105"
                  >
                    <span>ગણતરી ચકાસો</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POPUP: PhysicalCountModal with clear distributive lime border */}
      <PhysicalCountModal
        isOpen={isCountModalOpen}
        onClose={() => setIsCountModalOpen(false)}
        onSuccess={loadStock}
      />
    </div>
  );
};
