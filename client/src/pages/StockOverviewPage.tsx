import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SectionHeader } from '../components/SectionHeader';
import { StockOverviewModal } from '../components/modals/StockOverviewModal';
import {
  Layers,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const StockOverviewPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();

  const [stockItems, setStockItems] = useState<any[]>([]);
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStock = async () => {
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
  };

  useEffect(() => {
    loadStock();
  }, [user]);

  const thrItems = stockItems.filter((s) => s.item?.category === 'THR_PACKET');
  const hcmItems = stockItems.filter((s) => s.item?.category !== 'THR_PACKET');

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-cream-100 select-none">
      {/* SECTION HEADER (Pastel Blue) */}
      <SectionHeader
        title={language === 'gu' ? 'વર્તમાન સ્ટોક' : 'Stock Balance'}
        englishTitle="STOCK BALANCE & BUFFER HEALTH"
        icon={Layers}
        bgColor="bg-pastel-blue"
        borderColor="border-[#ADC4FA]"
        iconColor="text-pastel-blueIcon"
        actionButton={
          <button
            type="button"
            onClick={() => setIsOverviewModalOpen(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-pastel-blue hover:bg-pastel-blueHover border-2 border-[#ADC4FA] text-pastel-blueIcon font-black text-xs transition active:scale-95 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <Layers className="w-4 h-4 stroke-[2.2]" />
            <span>{language === 'gu' ? 'વિગતવાર પોપઅપ' : 'Inspect Stock'}</span>
          </button>
        }
      />

      {/* SECTION CONTENT: Metrics and Inventory Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-blue/60 border border-[#ADC4FA] text-pastel-blueIcon flex items-center justify-center flex-shrink-0">
              <Boxes className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'કુલ સામગ્રી પ્રકાર' : 'Item Categories'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                {stockItems.length} આઇટમ
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'સંતોષકારક સ્ટોક' : 'Healthy Stock'}
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-800">
                {stockItems.filter((s) => s.currentBalance > 10).length} પ્રકાર
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'ઓડિટ સ્થિતિ' : 'Audit Status'}
              </div>
              <div className="text-xs sm:text-sm font-black text-brand-navy uppercase">
                લેજર ચકાસાયેલ
              </div>
            </div>
          </div>
        </div>

        {/* Take-Home Ration (THR) Section */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E0D5C3] mb-3">
            <h2 className="text-sm sm:text-base font-black text-brand-navy font-sans">
              {language === 'gu' ? 'ટેક-હોમ રાશન પેકેટ (THR Packets)' : 'Take-Home Ration Packets'}
            </h2>
            <span className="text-xs font-bold text-brand-navy/60">
              {thrItems.length} પ્રકારના પેકેટ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {thrItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setIsOverviewModalOpen(true)}
                className="p-3.5 rounded-xl bg-[#FFFDF9] border-2 border-[#E0D5C3] hover:border-[#ADC4FA] transition shadow-2xs cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-brand-navy/60 uppercase">
                    {item.item?.code}
                  </div>
                  <div className="text-sm font-black text-brand-navy mt-0.5">
                    {language === 'gu' ? item.item?.nameGu : item.item?.nameEn}
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-[#E0D5C3]">
                  <div>
                    <span className="text-xl font-black text-brand-navy">
                      {item.currentBalance}
                    </span>
                    <span className="text-xs font-bold text-brand-navy/60 ml-1">
                      {item.item?.unit}
                    </span>
                  </div>
                  <span className="text-[10px] font-black bg-pastel-blue text-pastel-blueIcon px-2 py-0.5 rounded-md border border-[#ADC4FA]">
                    વિગત જુઓ →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hot Cooked Meals (HCM) Raw Grains Section */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E0D5C3] mb-3">
            <h2 className="text-sm sm:text-base font-black text-brand-navy font-sans">
              {language === 'gu' ? 'ગરમ ભોજન કાચો માલ (HCM Raw Grains & Pulses)' : 'HCM Raw Grains & Pulses'}
            </h2>
            <span className="text-xs font-bold text-brand-navy/60">
              {hcmItems.length} સામગ્રી
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {hcmItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setIsOverviewModalOpen(true)}
                className="p-3.5 rounded-xl bg-[#FFFDF9] border-2 border-[#E0D5C3] hover:border-[#ADC4FA] transition shadow-2xs cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-brand-navy/60 uppercase">
                    {item.item?.code}
                  </div>
                  <div className="text-sm font-black text-brand-navy mt-0.5 truncate">
                    {language === 'gu' ? item.item?.nameGu : item.item?.nameEn}
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-[#E0D5C3]">
                  <div>
                    <span className="text-xl font-black text-brand-navy">
                      {item.currentBalance}
                    </span>
                    <span className="text-xs font-bold text-brand-navy/60 ml-1">
                      {item.item?.unit}
                    </span>
                  </div>
                  <span className="text-[10px] font-black bg-cream-200 text-brand-navy px-2 py-0.5 rounded-md border border-[#E0D5C3]">
                    બેચ ઓડિટ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POPUP: StockOverviewModal with clear distributive blue border */}
      <StockOverviewModal
        isOpen={isOverviewModalOpen}
        onClose={() => setIsOverviewModalOpen(false)}
      />
    </div>
  );
};
