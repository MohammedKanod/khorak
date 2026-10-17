import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { enqueueOfflineOperation } from '../../db/offlineDb';
import { ModalWrapper } from '../ModalWrapper';
import { QuantityStepper } from '../QuantityStepper';
import confetti from 'canvas-confetti';
import {
  PackageCheck,
  Truck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  FileText,
} from 'lucide-react';

interface ReceiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDispatch?: any;
  onSuccess?: () => void;
}

export const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({
  isOpen,
  onClose,
  preselectedDispatch,
  onSuccess,
}) => {
  const { user, apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const { isOnline } = useOffline();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [selectedDispatch, setSelectedDispatch] = useState<any | null>(null);
  const [itemsState, setItemsState] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  // Load incoming dispatches on open
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSuccessResult(null);
      setError('');
      return;
    }

    async function loadDispatches() {
      try {
        const res = await apiFetch('/api/dispatches');
        const pending = (res.dispatches || []).filter(
          (d: any) => d.status === 'DISPATCHED' || d.status === 'PARTIALLY_RECEIVED'
        );
        setDispatches(pending);

        if (preselectedDispatch) {
          initDispatch(preselectedDispatch);
          setStep(2);
        } else if (pending.length > 0) {
          initDispatch(pending[0]);
        }
      } catch (err) {
        console.error('Failed to load dispatches:', err);
      }
    }
    loadDispatches();
  }, [isOpen, preselectedDispatch]);

  const initDispatch = (dispatch: any) => {
    setSelectedDispatch(dispatch);
    setItemsState(
      (dispatch.items || []).map((it: any) => ({
        itemId: it.itemId,
        item: it.item,
        batchNumber: it.batchNumber || '',
        quantityExpected: it.quantityDispatched,
        quantityAccepted: it.quantityDispatched,
        quantityDamaged: 0,
        quantityShort: 0,
        unit: it.unit || 'packets',
        conditionStatus: 'GOOD',
      }))
    );
  };

  const updateItem = (index: number, field: string, val: any) => {
    setItemsState((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: val };
      if (field === 'quantityAccepted' || field === 'quantityDamaged') {
        const total = (field === 'quantityAccepted' ? val : item.quantityAccepted) +
          (field === 'quantityDamaged' ? val : item.quantityDamaged);
        item.quantityShort = Math.max(0, Number((item.quantityExpected - total).toFixed(2)));
      }
      next[index] = item;
      return next;
    });
  };

  const hasAnyDiscrepancy = itemsState.some(
    (it) => it.quantityDamaged > 0 || it.quantityShort > 0
  );

  const handleSubmit = async () => {
    if (!user?.awcId || !selectedDispatch) return;

    setError('');
    setSubmitting(true);

    const payload = {
      dispatchId: selectedDispatch.id,
      awcId: user.awcId,
      receivedByUserId: user.id,
      receivedAt: new Date().toISOString(),
      challanNumber: selectedDispatch.challanNumber,
      notes,
      items: itemsState.map((it) => ({
        itemId: it.itemId,
        batchNumber: it.batchNumber,
        quantityExpected: it.quantityExpected,
        quantityAccepted: it.quantityAccepted,
        quantityDamaged: it.quantityDamaged,
        quantityShort: it.quantityShort,
        unit: it.unit,
        conditionStatus: it.quantityDamaged > 0 ? 'DAMAGED' : 'GOOD',
      })),
    };

    try {
      if (isOnline) {
        const res = await apiFetch('/api/receipts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessResult(res);
      } else {
        await enqueueOfflineOperation('RECEIPT_VERIFY', payload);
        setSuccessResult({
          offline: true,
          message:
            language === 'gu'
              ? 'સ્થાનિક રીતે સાચવવામાં આવ્યું છે. ઇન્ટરનેટ આવતાં આપમેળે સિંક થઈ જશે.'
              : 'Saved locally. Will sync when back online.',
        });
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error recording receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndicatorText =
    language === 'gu' ? `પગલું ${step}/3` : `Step ${step}/3`;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'gu' ? 'સ્ટોક મેળવો (ચલણ ચકાસણી)' : 'Receive Stock'}
      subtitle={
        language === 'gu'
          ? 'આવેલ જથ્થાની ચકાસણી અને પાવતી નોંધણી'
          : 'Verify delivery against challan and record receipt'
      }
      englishTitle="RECEIVE STOCK"
      icon={PackageCheck}
      iconColor="text-pastel-pinkIcon"
      bgColor="bg-pastel-pink"
      borderColor="border-[#F8B4BA]"
      stepIndicator={!successResult ? stepIndicatorText : undefined}
      onBack={step > 1 && !successResult ? () => setStep((s) => (s - 1) as any) : undefined}
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

            {step === 1 && (
              <button
                type="button"
                disabled={!selectedDispatch}
                onClick={() => setStep(2)}
                className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeLight text-white text-xs font-black transition active:scale-95 disabled:opacity-50 flex items-center space-x-1"
              >
                <span>{language === 'gu' ? 'આગળ વધો →' : 'Next →'}</span>
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeLight text-white text-xs font-black transition active:scale-95 flex items-center space-x-1"
              >
                <span>{language === 'gu' ? 'સારાંશ જુઓ →' : 'Review Summary →'}</span>
              </button>
            )}

            {step === 3 && (
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
                        ? 'ખાતરી કરો અને રસીદ સાચવો'
                        : 'Confirm & Record Receipt'}
                    </span>
                  </>
                )}
              </button>
            )}
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
            {language === 'gu' ? 'સ્ટોક સફળતાપૂર્વક મેળવાઈ ગયો!' : 'Stock Successfully Received!'}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {successResult.message ||
              (language === 'gu'
                ? 'તમારો વર્તમાન સ્ટોક અને નોંધપોથી આપમેળે અપડેટ થઈ ગઈ છે.'
                : 'Current balance and ledger have been updated automatically.')}
          </p>
        </div>
      )}

      {/* STEP 1: SELECT DISPATCH */}
      {!successResult && step === 1 && (
        <div className="space-y-3">
          <div className="text-xs font-black text-brand-navy">
            {language === 'gu'
              ? '1. આવતી ડિલિવરી પસંદ કરો:'
              : '1. Select Incoming Delivery:'}
          </div>

          {dispatches.length === 0 ? (
            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-center">
              <Truck className="w-8 h-8 text-amber-700 mx-auto mb-2" />
              <div className="text-xs font-bold text-amber-900">
                {language === 'gu'
                  ? 'કોઈ નવી ડિસ્પેચ ડિલિવરી બાકી નથી.'
                  : 'No pending dispatches found.'}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {dispatches.map((d) => {
                const isSelected = selectedDispatch?.id === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => initDispatch(d)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-pastel-pink border-rose-400 ring-2 ring-rose-300'
                        : 'bg-[#FFF0F2] border-[#FCD6DB] hover:bg-[#FCE5E7]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-brand-navy">
                        {d.supplier
                          ? language === 'gu'
                            ? d.supplier.nameGu
                            : d.supplier.nameEn
                          : 'Supplier'}{' '}
                        <span className="font-mono text-slate-500">
                          · #{d.challanNumber}
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        {d.items?.length || 0} {language === 'gu' ? 'વસ્તુઓ' : 'items'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                      {(d.items || [])
                        .map((it: any) => `${it.item?.nameGu || it.itemId} (${it.quantityDispatched})`)
                        .join(', ')}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: VERIFY QUANTITIES */}
      {!successResult && step === 2 && (
        <div className="space-y-4">
          <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <div>
              <span className="font-bold">
                {language === 'gu' ? 'ચલણ નંબર:' : 'Challan #:'}
              </span>{' '}
              <code className="font-mono font-bold">
                {selectedDispatch?.challanNumber}
              </code>
            </div>
            <div className="text-[11px] text-amber-800">
              {selectedDispatch?.supplier?.nameGu || selectedDispatch?.supplier?.nameEn}
            </div>
          </div>

          <div className="space-y-3">
            {itemsState.map((it, idx) => (
              <div
                key={it.itemId || idx}
                className="bg-[#FFF0F2] p-3.5 rounded-2xl border border-[#FCD6DB] shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-black text-xs text-brand-navy">
                    {it.item
                      ? language === 'gu'
                        ? it.item.nameGu
                        : it.item.nameEn
                      : it.itemId}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500">
                    {language === 'gu' ? 'ચલણ જથ્થો:' : 'Expected:'}{' '}
                    <span className="text-brand-navy font-black">
                      {it.quantityExpected} {it.unit}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  {/* Accepted Quantity */}
                  <div>
                    <label className="text-[10px] font-bold text-emerald-800 block mb-1">
                      {language === 'gu' ? 'મળેલ / સ્વીકાર્ય' : 'Accepted Qty'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={it.quantityExpected}
                      step="any"
                      value={it.quantityAccepted}
                      onChange={(e) =>
                        updateItem(idx, 'quantityAccepted', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/50 text-xs font-bold text-emerald-900"
                    />
                  </div>

                  {/* Damaged Quantity */}
                  <div>
                    <label className="text-[10px] font-bold text-rose-800 block mb-1">
                      {language === 'gu' ? 'બગાડ / નુકસાન' : 'Damaged Qty'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={it.quantityExpected}
                      step="any"
                      value={it.quantityDamaged}
                      onChange={(e) =>
                        updateItem(idx, 'quantityDamaged', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl border border-rose-300 bg-rose-50/50 text-xs font-bold text-rose-900"
                    />
                  </div>

                  {/* Shortage */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold text-amber-800 block mb-1">
                      {language === 'gu' ? 'ઓછો આવેલ' : 'Shortage'}
                    </label>
                    <div className="px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-xs font-bold text-amber-900">
                      {it.quantityShort} {it.unit}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: SUMMARY & CONFIRMATION */}
      {!successResult && step === 3 && (
        <div className="space-y-3.5">
          {hasAnyDiscrepancy && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 flex items-start space-x-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">
                  {language === 'gu'
                    ? 'વિસંગતતા નોંધી છે!'
                    : 'Discrepancy Detected!'}
                </span>{' '}
                {language === 'gu'
                  ? 'ઓછો અથવા બગડેલો જથ્થો મુખ્ય સેવિકા (સુપરવાઇઝર) ને આપમેળે ફ્લેગ કરવામાં આવશે.'
                  : 'Shortage or damaged quantity will be flagged automatically to your Supervisor.'}
              </div>
            </div>
          )}

          <div className="bg-[#FFF0F2] rounded-2xl border border-[#FCD6DB] p-3.5 space-y-2">
            <div className="text-xs font-black text-brand-navy border-b pb-1.5">
              {language === 'gu' ? 'રસીદ સારાંશ' : 'Receipt Summary'}
            </div>
            {itemsState.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
              >
                <span className="font-semibold text-slate-800">
                  {it.item?.nameGu || it.itemId}
                </span>
                <span className="font-mono font-bold text-brand-navy">
                  {it.quantityAccepted} {it.unit}{' '}
                  {it.quantityDamaged > 0 && (
                    <span className="text-rose-600 text-[10px]">
                      (+{it.quantityDamaged} બગડેલ)
                    </span>
                  )}
                  {it.quantityShort > 0 && (
                    <span className="text-amber-600 text-[10px]">
                      (-{it.quantityShort} ઓછો)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-brand-navy block mb-1">
              {language === 'gu' ? 'નોંધ (વૈકલ્પિક):' : 'Notes (Optional):'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                language === 'gu'
                  ? 'દા.ત. વાહન નં. GJ-17-X, પેકિંગ સીલ યોગ્ય છે'
                  : 'e.g. Vehicle no., packing seal verified'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-orange/50"
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
