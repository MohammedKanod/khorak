import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { enqueueOfflineOperation } from '../../db/offlineDb';
import { ModalWrapper } from '../ModalWrapper';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertTriangle,
  Boxes,
  HelpCircle,
  Scale,
} from 'lucide-react';

interface PhysicalCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PhysicalCountModal: React.FC<PhysicalCountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const { isOnline } = useOffline();

  const [stockOverview, setStockOverview] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [actualCount, setActualCount] = useState<number>(0);
  const [reasonCode, setReasonCode] = useState<string>('MEASUREMENT_ERROR');
  const [explanation, setExplanation] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !user?.awcId) {
      setSuccessResult(null);
      setError('');
      return;
    }

    async function loadStock() {
      if (!user?.awcId) return;
      try {
        const res = await apiFetch(`/api/stock/awc/${user.awcId}`);
        const items = res.stockOverview || [];
        setStockOverview(items);
        if (items.length > 0) {
          setSelectedItemId(items[0].item.id);
          setActualCount(items[0].currentBalance);
        }
      } catch (err) {
        console.error('Failed to load stock overview:', err);
      }
    }
    loadStock();
  }, [isOpen, user]);

  const selectedItem = stockOverview.find((s) => s.item.id === selectedItemId);
  const bookBalance = selectedItem ? selectedItem.currentBalance : 0;
  const variance = Number((actualCount - bookBalance).toFixed(2));
  const hasVariance = Math.abs(variance) > 0.001;

  const handleSubmit = async () => {
    if (!user?.awcId || !selectedItemId) return;

    setError('');
    setSubmitting(true);

    const payload = {
      awcId: user.awcId,
      itemId: selectedItemId,
      countedByUserId: user.id,
      bookBalance,
      actualCount,
      variance,
      reasonCode: hasVariance ? reasonCode : 'NONE',
      explanation,
      countDate: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        const res = await apiFetch('/api/physical-count', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessResult(res);
      } else {
        await enqueueOfflineOperation('PHYSICAL_COUNT', payload);
        setSuccessResult({
          offline: true,
          message:
            language === 'gu'
              ? 'ભૌતિક ગણતરી સ્થાનિક રીતે સાચવી લેવાઈ છે.'
              : 'Physical count stored offline safely.',
        });
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error recording physical count');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'gu' ? 'ભૌતિક સ્ટોક ગણતરી' : 'Physical Stock Count'}
      subtitle={
        language === 'gu'
          ? 'ગોડાઉનમાં હાજર વાસ્તવિક સ્ટોક ચકાસણી અને મેળવણી'
          : 'Reconcile on-ground physical inventory against ledger'
      }
      englishTitle="PHYSICAL COUNT"
      icon={Scale}
      iconColor="text-pastel-limeIcon"
      bgColor="bg-pastel-lime"
      borderColor="border-[#B0F090]"
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
              className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition active:scale-95 disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
            >
              {submitting ? (
                <span>{language === 'gu' ? 'સાચવે છે...' : 'Saving...'}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {language === 'gu'
                      ? 'ગણતરી દાખલ કરો'
                      : 'Submit Verification'}
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
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-brand-navy">
            {language === 'gu'
              ? 'ભૌતિક ગણતરી સફળતાપૂર્વક સાચવી લીધી!'
              : 'Physical Count Saved!'}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {hasVariance
              ? language === 'gu'
                ? `ચોપડા અને વાસ્તવિક જથ્થા વચ્ચે ${Math.abs(variance)} નો તફાવત નોંધાયો છે અને સુપરવાઇઝરને જાણ કરી દેવાઈ છે.`
                : `A variance of ${Math.abs(variance)} has been recorded and flagged for supervisory review.`
              : language === 'gu'
              ? 'તમારો ભૌતિક સ્ટોક અને ચોપડો 100% મેળ ખાય છે.'
              : 'Physical count matches ledger balance 100%.'}
          </p>
        </div>
      )}

      {!successResult && (
        <div className="space-y-4">
          {/* Item Selector */}
          <div>
            <label className="text-xs font-black text-brand-navy block mb-1">
              {language === 'gu' ? '1. વસ્તુ પસંદ કરો:' : '1. Select Item to Count:'}
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedItemId(id);
                const item = stockOverview.find((s) => s.item.id === id);
                if (item) setActualCount(item.currentBalance);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy bg-white"
            >
              {stockOverview.map((s) => (
                <option key={s.item.id} value={s.item.id}>
                  {language === 'gu' ? s.item.nameGu : s.item.nameEn} (ચોપડે:{' '}
                  {s.currentBalance} {s.item.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Side-by-Side Comparison: Book Balance vs Actual Count */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#F2FCEE] rounded-2xl border border-[#C8F8B2] text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'gu' ? 'ચોપડે સ્ટોક (Book)' : 'Book Balance'}
              </span>
              <div className="text-xl sm:text-2xl font-black text-brand-navy mt-1">
                {bookBalance}
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {selectedItem?.item.unit}
              </span>
            </div>

            <div className="p-3.5 bg-[#E2F8DA] rounded-2xl border border-[#A6F188] text-center">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                {language === 'gu' ? 'વાસ્તવિક ગણતરી (Actual)' : 'Actual Physical'}
              </span>
              <div className="mt-1 flex items-center justify-center">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={actualCount}
                  onChange={(e) => setActualCount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded-xl border border-emerald-500 bg-white text-lg font-black text-emerald-950 text-center"
                />
              </div>
              <span className="text-[11px] font-bold text-emerald-900">
                {selectedItem?.item.unit}
              </span>
            </div>
          </div>

          {/* Variance Notice */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${
              !hasVariance
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : variance < 0
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <span>
              {language === 'gu' ? 'તફાવત (Variance):' : 'Calculated Variance:'}
            </span>
            <span className="font-mono text-sm font-black">
              {variance > 0 ? `+${variance}` : variance} {selectedItem?.item.unit}
            </span>
          </div>

          {/* Reason if Variance Exists */}
          {hasVariance && (
            <div className="p-3.5 bg-[#F2FCEE] rounded-2xl border border-[#C8F8B2] space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {language === 'gu'
                    ? 'તફાવતનું મુખ્ય કારણ (Reason for Variance):'
                    : 'Reason for Variance:'}
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy"
                >
                  <option value="MEASUREMENT_ERROR">
                    {language === 'gu' ? 'માપન / વજન ભૂલ' : 'Measurement/Weighing error'}
                  </option>
                  <option value="SPOILAGE_UNREPORTED">
                    {language === 'gu' ? 'અગાઉ બગાડ નોંધાયો નહોતો' : 'Unreported spoilage/rodent'}
                  </option>
                  <option value="DISTRIBUTION_OMISSION">
                    {language === 'gu' ? 'વિતરણ નોંધ રહી ગઈ હતી' : 'Distribution log omission'}
                  </option>
                  <option value="OTHER">{language === 'gu' ? 'અન્ય કારણ' : 'Other reason'}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {language === 'gu' ? 'વિગતે ખુલાસો:' : 'Detailed Explanation:'}
                </label>
                <input
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder={
                    language === 'gu'
                      ? 'દા.ત. જૂના બેચમાં વજન ઘટ આવેલ છે'
                      : 'e.g. Bag moisture loss during storage'
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
            </div>
          )}

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
