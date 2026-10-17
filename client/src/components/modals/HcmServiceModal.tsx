import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { enqueueOfflineOperation } from '../../db/offlineDb';
import { ModalWrapper } from '../ModalWrapper';
import confetti from 'canvas-confetti';
import {
  UtensilsCrossed,
  CheckCircle2,
  Flame,
  Users,
  AlertTriangle,
} from 'lucide-react';

interface HcmServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const HcmServiceModal: React.FC<HcmServiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const { isOnline } = useOffline();

  const [hcmItems, setHcmItems] = useState<any[]>([]);
  const [stockOverview, setStockOverview] = useState<any[]>([]);
  const [enrolledCount, setEnrolledCount] = useState<number>(25);
  const [attendanceCount, setAttendanceCount] = useState<number>(20);
  const [mealsServedCount, setMealsServedCount] = useState<number>(20);
  const [menuDescription, setMenuDescription] = useState<string>(
    'સુખડી અને પોષક ખીચડી (Sukhdi & Khichdi)'
  );
  const [ingredientsUsage, setIngredientsUsage] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSuccessResult(null);
      setError('');
      return;
    }

    async function loadData() {
      if (!user?.awcId) return;
      try {
        const [itemsRes, stockRes] = await Promise.all([
          apiFetch('/api/items'),
          apiFetch(`/api/stock/awc/${user.awcId}`),
        ]);

        const raw = (itemsRes.items || []).filter(
          (i: any) =>
            i.category === 'HCM_RAW_GRAIN' ||
            i.category === 'HCM_PULSE' ||
            i.category === 'HCM_OIL'
        );
        setHcmItems(raw);
        setStockOverview(stockRes.stockOverview || []);

        const initialUsage: Record<string, number> = {};
        for (const it of raw) {
          if (it.code === 'HCM-WHT-01') initialUsage[it.id] = 2.0;
          else if (it.code === 'HCM-RIC-02') initialUsage[it.id] = 1.5;
          else if (it.code === 'HCM-DAL-03') initialUsage[it.id] = 0.5;
          else if (it.code === 'HCM-OIL-04') initialUsage[it.id] = 0.25;
          else initialUsage[it.id] = 1.0;
        }
        setIngredientsUsage(initialUsage);
      } catch (err) {
        console.error('Failed to load HCM data:', err);
      }
    }
    loadData();
  }, [isOpen, user]);

  const handleUsageChange = (itemId: string, val: number) => {
    setIngredientsUsage((prev) => ({
      ...prev,
      [itemId]: Math.max(0, Number(val.toFixed(2))),
    }));
  };

  const handleSubmit = async () => {
    if (!user?.awcId) return;

    setError('');
    setSubmitting(true);

    const consumedIngredients = Object.entries(ingredientsUsage)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const it = hcmItems.find((i) => i.id === itemId);
        return {
          itemId,
          quantityConsumed: qty,
          unit: it?.unit || 'kg',
        };
      });

    const payload = {
      awcId: user.awcId,
      serviceDate: new Date().toISOString(),
      mealType: 'LUNCH',
      menuDescription,
      enrolledCount,
      attendanceCount,
      mealsServedCount,
      recordedByUserId: user.id,
      consumedIngredients,
    };

    try {
      if (isOnline) {
        const res = await apiFetch('/api/hcm/service', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessResult(res);
      } else {
        await enqueueOfflineOperation('HCM_SERVICE', payload);
        setSuccessResult({
          offline: true,
          message:
            language === 'gu'
              ? 'ગરમ ભોજન સેવા સ્થાનિક રીતે સુરક્ષિત સાચવાઈ છે.'
              : 'Meal service recorded offline safely.',
        });
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error recording HCM service');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'gu' ? 'ગરમ ભોજન સેવા (HCM)' : 'Hot Cooked Meals'}
      subtitle={
        language === 'gu'
          ? 'દૈનિક ભોજન હાજરી અને વપરાયેલ અનાજની નોંધ'
          : 'Daily attendance and raw ingredient consumption'
      }
      englishTitle="HOT COOKED MEALS"
      icon={UtensilsCrossed}
      iconColor="text-pastel-cyanIcon"
      bgColor="bg-pastel-cyan"
      borderColor="border-[#98EDE4]"
      maxWidth="3xl"
      footerActions={
        successResult ? (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition active:scale-95"
          >
            {language === 'gu' ? 'પૂર્ણ થયું (બંધ કરો)' : 'Done (Close)'}
          </button>
        ) : (
          <div className="w-full flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition active:scale-95"
            >
              {language === 'gu' ? 'રદ કરો' : 'Cancel'}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black transition active:scale-95 disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
            >
              {submitting ? (
                <span>{language === 'gu' ? 'સાચવે છે...' : 'Saving...'}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {language === 'gu'
                      ? 'ભોજન નોંધ સાચવો'
                      : 'Confirm Meal Service'}
                  </span>
                </>
              )}
            </button>
          </div>
        )
      }
    >
      {/* SUCCESS STATE */}
      {successResult && (
        <div className="text-center py-6 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-brand-navy">
            {language === 'gu'
              ? 'ગરમ ભોજન સેવા સફળતાપૂર્વક નોંધાઈ ગઈ!'
              : 'Meal Service Successfully Recorded!'}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {mealsServedCount} બાળકોને પીરસવામાં આવેલ ભોજન અને વપરાયેલ અનાજનો જથ્થો સ્ટોક નોંધપોથીમાં નોંધાઈ ગયો છે.
          </p>
        </div>
      )}

      {!successResult && (
        <div className="space-y-4">
          {/* Children Attendance & Meal Count */}
          <div className="p-3.5 bg-[#EAFBF9] rounded-2xl border border-[#B6F5EE] shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-black text-brand-navy border-b border-[#B6F5EE]/60 pb-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>
                {language === 'gu'
                  ? '1. બાળકોની હાજરી અને પીરસેલ સંખ્યા:'
                  : '1. Daily Attendance & Meals Served:'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {language === 'gu' ? 'કુલ નોંધાયેલ બાળકો:' : 'Enrolled Children:'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={enrolledCount}
                  onChange={(e) => setEnrolledCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#B6F5EE] bg-white text-xs font-bold text-brand-navy"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {language === 'gu' ? 'આજની હાજરી (હાજર):' : 'Present Today:'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={enrolledCount}
                  value={attendanceCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setAttendanceCount(val);
                    setMealsServedCount(val);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#B6F5EE] bg-white text-xs font-bold text-brand-navy"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-teal-800 block mb-1">
                  {language === 'gu' ? 'પીરસાયેલ ભોજન:' : 'Meals Served:'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={mealsServedCount}
                  onChange={(e) => setMealsServedCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl border border-teal-300 bg-white text-xs font-black text-teal-900"
                />
              </div>
            </div>
          </div>

          {/* Raw Ingredients Usage */}
          <div className="p-3.5 bg-[#EAFBF9] rounded-2xl border border-[#B6F5EE] shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-black text-brand-navy border-b border-[#B6F5EE]/60 pb-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>
                {language === 'gu'
                  ? '2. વપરાયેલ કાચો માલ (અનાજ / તેલ / કઠોળ):'
                  : '2. Raw Ingredients Consumed:'}
              </span>
            </div>

            <div className="space-y-2">
              {hcmItems.map((item) => {
                const stockItem = stockOverview.find((s) => s.item?.id === item.id);
                const currentBalance = stockItem ? stockItem.currentBalance : 0;
                const usage = ingredientsUsage[item.id] || 0;

                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-[#B6F5EE] bg-[#F0FCFA] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-brand-navy">
                        {language === 'gu' ? item.nameGu : item.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {language === 'gu' ? 'હાલનો સ્ટોક:' : 'Balance:'}{' '}
                        <span className="font-bold text-brand-navy">
                          {currentBalance} {item.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={usage}
                        onChange={(e) =>
                          handleUsageChange(item.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-right"
                      />
                      <span className="text-[11px] font-bold text-slate-600 w-8">
                        {item.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 font-bold">
              {error}
            </div>
          )}
        </div>
      )}
    </ModalWrapper>
  );
};
