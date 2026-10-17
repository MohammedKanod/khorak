import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { enqueueOfflineOperation } from '../../db/offlineDb';
import { ModalWrapper } from '../ModalWrapper';
import confetti from 'canvas-confetti';
import {
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';

interface WriteOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WriteOffModal: React.FC<WriteOffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const { isOnline } = useOffline();

  const [stockOverview, setStockOverview] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(2);
  const [reasonCode, setReasonCode] = useState<string>('RODENT_DAMAGE');
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
        }
      } catch (err) {
        console.error('Failed to load stock overview:', err);
      }
    }
    loadStock();
  }, [isOpen, user]);

  const selectedItem = stockOverview.find((s) => s.item.id === selectedItemId);

  const reasons = [
    {
      code: 'RODENT_DAMAGE',
      labelGu: 'ઉંદર / જીવાત નુકસાન',
      labelEn: 'Rodent / Pest Damage',
    },
    {
      code: 'WATER_MOISTURE',
      labelGu: 'પાણી / ભેજ લાગવો',
      labelEn: 'Moisture / Water Damage',
    },
    {
      code: 'PACKET_BURST',
      labelGu: 'પેકિંગ ફાટી જવું',
      labelEn: 'Packet Burst / Punctured',
    },
    {
      code: 'EXPIRED',
      labelGu: 'મુદત વીતી ગયેલ (Expiry)',
      labelEn: 'Date Expired',
    },
    {
      code: 'TRANSIT_DAMAGE',
      labelGu: 'વાહનિવહારમાં નુકસાન',
      labelEn: 'Transit / Unloading Damage',
    },
  ];

  const handleSubmit = async () => {
    if (!user?.awcId || !selectedItemId || quantity <= 0) return;

    setError('');
    setSubmitting(true);

    const payload = {
      awcId: user.awcId,
      itemId: selectedItemId,
      quantity,
      unit: selectedItem?.item.unit || 'packets',
      reasonCode,
      explanation,
      reportedByUserId: user.id,
      incidentDate: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        const res = await apiFetch('/api/write-off', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessResult(res);
      } else {
        await enqueueOfflineOperation('WRITE_OFF', payload);
        setSuccessResult({
          offline: true,
          message:
            language === 'gu'
              ? 'બગાડ રિપોર્ટ સ્થાનિક રીતે નોંધાઈ ગયો છે.'
              : 'Write-off reported offline safely.',
        });
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error submitting write-off');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'gu' ? 'બગાડ / નુકસાન રિપોર્ટ' : 'Report Damage / Spoilage'}
      subtitle={
        language === 'gu'
          ? 'ખરાબ થયેલ રાશન જથ્થાની મંજૂરી અર્થે અરજી'
          : 'Report spoiled stock for mandatory supervisor approval'
      }
      englishTitle="DAMAGE / SPOILAGE"
      icon={TrendingDown}
      iconColor="text-pastel-purpleIcon"
      bgColor="bg-pastel-purple"
      borderColor="border-[#F4A9EE]"
      maxWidth="3xl"
      footerActions={
        successResult ? (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs transition active:scale-95"
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
              className="px-6 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black transition active:scale-95 disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
            >
              {submitting ? (
                <span>{language === 'gu' ? 'સાચવે છે...' : 'Saving...'}</span>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {language === 'gu'
                      ? 'મંજૂરી માટે મોકલો'
                      : 'Submit for Approval'}
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
          <div className="w-14 h-14 mx-auto rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-brand-navy">
            {language === 'gu'
              ? 'બગાડ રિપોર્ટ સફળતાપૂર્વક મોકલાઈ ગયો!'
              : 'Damage Report Submitted!'}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {language === 'gu'
              ? 'મુખ્ય સેવિકા (સુપરવાઇઝર) દ્વારા ચકાસણી અને મંજૂરી મળ્યા બાદ જ સ્ટોક લેજરમાંથી આ જથ્થો માંડી વળાશે.'
              : 'Stock will be deducted from your ledger only after physical verification and approval by the Supervisor.'}
          </p>
        </div>
      )}

      {!successResult && (
        <div className="space-y-4">
          {/* Important Regulatory Notice */}
          <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200 flex items-start space-x-2.5 text-xs text-purple-950">
            <ShieldAlert className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {language === 'gu'
                  ? 'નિયમ અનુસાર સૂચના:'
                  : 'Mandatory Policy Rule:'}
              </span>{' '}
              {language === 'gu'
                ? 'બગડેલ જથ્થાને અલગ પેક કરીને સાચવવો. સુપરવાઇઝર મંજૂરી વગર સીધો નિકાલ કરી શકાતો નથી.'
                : 'Damaged stock must be segregated and retained until inspected by the Supervisor.'}
            </div>
          </div>

          {/* Item & Quantity Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-black text-brand-navy block mb-1">
                {language === 'gu' ? '1. નુકસાન પામેલ વસ્તુ:' : '1. Damaged Item:'}
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy bg-white"
              >
                {stockOverview.map((s) => (
                  <option key={s.item.id} value={s.item.id}>
                    {language === 'gu' ? s.item.nameGu : s.item.nameEn} (હાજર:{' '}
                    {s.currentBalance} {s.item.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-brand-navy block mb-1">
                {language === 'gu' ? 'બગડેલ જથ્થો:' : 'Damaged Qty:'}
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="1"
                  max={selectedItem?.currentBalance || 100}
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-purple-950 text-center"
                />
                <span className="text-xs font-bold text-slate-500">
                  {selectedItem?.item.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Reason Selection Grid */}
          <div>
            <label className="text-xs font-black text-brand-navy block mb-2">
              {language === 'gu' ? '2. નુકસાનનું કારણ પસંદ કરો:' : '2. Select Reason:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {reasons.map((r) => {
                const isSelected = reasonCode === r.code;
                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => setReasonCode(r.code)}
                    className={`p-2.5 rounded-xl border text-left transition text-xs font-bold flex items-center justify-between ${
                      isSelected
                        ? 'bg-pastel-purple border-purple-400 text-purple-950 ring-2 ring-purple-300'
                        : 'bg-[#FDF6FD] border-[#F8D2F5] text-purple-950 hover:bg-[#FCEBFB]'
                    }`}
                  >
                    <span>{language === 'gu' ? r.labelGu : r.labelEn}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-purple-700" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation Text */}
          <div>
            <label className="text-xs font-black text-brand-navy block mb-1">
              {language === 'gu' ? '3. વિગતે નોંધ (કારણ અને સ્થિતિ):' : '3. Notes:'}
            </label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder={
                language === 'gu'
                  ? 'દા.ત. ભારે વરસાદથી ગોડાઉનમાં પાણી ભરાતાં નીચેના 2 બોક્સ પલળી ગયા'
                  : 'e.g. Water seepage during heavy rain affected 2 boxes'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            />
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
