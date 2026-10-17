import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SectionHeader } from '../components/SectionHeader';
import { HcmServiceModal } from '../components/modals/HcmServiceModal';
import {
  UtensilsCrossed,
  Users,
  CheckCircle2,
  Calendar,
  Flame,
  Boxes,
  ArrowRight,
} from 'lucide-react';

export const HcmServicePage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();

  const [hcmItems, setHcmItems] = useState<any[]>([]);
  const [stockOverview, setStockOverview] = useState<any[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHcmData = async () => {
    if (!user?.awcId) return;
    try {
      setLoading(true);
      const [itemsRes, stockRes] = await Promise.all([
        apiFetch('/api/items'),
        apiFetch(`/api/stock/awc/${user.awcId}`),
      ]);

      const rawItems = (itemsRes.items || []).filter(
        (i: any) =>
          i.category === 'HCM_RAW_GRAIN' ||
          i.category === 'HCM_PULSE' ||
          i.category === 'HCM_OIL'
      );
      setHcmItems(rawItems);
      setStockOverview(stockRes.stockOverview || []);
    } catch (err) {
      console.error('Failed to load HCM data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHcmData();
  }, [user]);

  // Mock recent meal logs
  const recentMealLogs = [
    { date: '17/10/2026', menu: 'સુખડી અને પૌષ્ટિક ખીચડી', enrolled: 25, attendance: 21, served: 21, status: 'VERIFIED' },
    { date: '16/10/2026', menu: 'ફણગાવેલા કઠોળ અને રોટલી', enrolled: 25, attendance: 22, served: 22, status: 'VERIFIED' },
    { date: '15/10/2026', menu: 'મુઠિયા અને દાળ-ભાત', enrolled: 25, attendance: 20, served: 20, status: 'VERIFIED' },
    { date: '14/10/2026', menu: 'શાક-રોટલી અને ખીચડી', enrolled: 25, attendance: 23, served: 23, status: 'VERIFIED' },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-cream-100 select-none">
      {/* SECTION HEADER (Pastel Cyan) */}
      <SectionHeader
        title={language === 'gu' ? 'ગરમ ભોજન સેવા' : 'Hot Cooked Meals'}
        englishTitle="HOT COOKED MEALS (HCM)"
        icon={UtensilsCrossed}
        bgColor="bg-pastel-cyan"
        borderColor="border-[#98EDE4]"
        iconColor="text-pastel-cyanIcon"
        actionButton={
          <button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-pastel-cyan hover:bg-pastel-cyanHover border-2 border-[#98EDE4] text-pastel-cyanIcon font-black text-xs transition active:scale-95 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <UtensilsCrossed className="w-4 h-4 stroke-[2.2]" />
            <span>{language === 'gu' ? '+ આજનું ભોજન નોંધો' : '+ Log Meal'}</span>
          </button>
        }
      />

      {/* SECTION CONTENT: Metrics, Raw Ingredients Buffer, and Daily Logs */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-cyan/60 border border-[#98EDE4] text-pastel-cyanIcon flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'નોંધાયેલ બાળકો' : 'Enrolled Children'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                25 બાળકો
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'સરેરાશ હાજરી' : 'Avg Attendance'}
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-800">
                88% (22/25)
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-peach/60 border border-[#FDC58A] text-pastel-peachIcon flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'આજનું મેનુ' : "Today's Menu"}
              </div>
              <div className="text-xs sm:text-sm font-black text-brand-navy truncate">
                સુખડી & ખીચડી
              </div>
            </div>
          </div>
        </div>

        {/* Raw Ingredients Buffer Stock Cards with distinct borders */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E0D5C3] mb-3">
            <div className="flex items-center space-x-2">
              <Boxes className="w-5 h-5 text-pastel-cyanIcon stroke-[2.2]" />
              <h2 className="text-sm sm:text-base font-black text-brand-navy font-sans">
                {language === 'gu' ? 'કાચો માલ સ્ટોક બેલેન્સ (Raw Ingredients for Meals)' : 'Raw Ingredients Buffer'}
              </h2>
            </div>
            <span className="text-xs font-bold text-brand-navy/60">
              {hcmItems.length} સામગ્રી
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {hcmItems.map((item) => {
              const stock = stockOverview.find((s) => s.item?.id === item.id);
              const balance = stock ? stock.currentBalance : 0;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#FFFDF9] border-2 border-[#E0D5C3] flex flex-col justify-between"
                >
                  <span className="text-xs font-black text-brand-navy truncate block">
                    {language === 'gu' ? item.nameGu : item.nameEn}
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-black text-brand-navy">
                      {balance}
                    </span>
                    <span className="text-[11px] font-bold text-brand-navy/60">
                      {item.unit}
                    </span>
                  </div>
                  <span className="mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 self-start">
                    સ્ટોક પૂરતો છે
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Service Attendance History Logs */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E0D5C3] mb-3">
            <h2 className="text-sm sm:text-base font-black text-brand-navy font-sans">
              {language === 'gu' ? 'દૈનિક ભોજન વિતરણ લોગ' : 'Daily Meal Service Logs'}
            </h2>
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="text-xs font-black text-pastel-cyanIcon hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>+ નવી એન્ટ્રી</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>

          <div className="space-y-2">
            {recentMealLogs.map((log, idx) => (
              <div
                key={idx}
                onClick={() => setIsLogModalOpen(true)}
                className="p-3 rounded-xl bg-[#FFFDF9] border-2 border-[#E0D5C3] hover:border-[#98EDE4] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-pastel-cyan/50 text-pastel-cyanIcon border border-[#98EDE4] flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-brand-navy">
                      {log.date} · {log.menu}
                    </div>
                    <div className="text-[11px] text-brand-navy/60 font-semibold">
                      હાજરી: {log.attendance} / {log.enrolled} બાળકો
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {log.served} ભોજન પીરસાયા
                  </span>
                  <span className="text-[10px] font-bold text-brand-navy/40">ચકાસેલ</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POPUP: HcmServiceModal with clear distributive cyan border */}
      <HcmServiceModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={loadHcmData}
      />
    </div>
  );
};
