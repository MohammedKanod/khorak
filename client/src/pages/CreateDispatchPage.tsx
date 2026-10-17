import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { QuantityStepper } from '../components/QuantityStepper';
import confetti from 'canvas-confetti';
import { Truck, ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const CreateDispatchPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [awcs, setAwcs] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [destinationAwcId, setDestinationAwcId] = useState<string>('');
  const [challanNumber, setChallanNumber] = useState<string>(`CH-GCMMFL-${Math.floor(1000 + Math.random() * 9000)}`);
  const [vehicleNumber, setVehicleNumber] = useState<string>('GJ-17-X-5511');
  const [driverName, setDriverName] = useState<string>('Govindbhai Patel');
  const [driverPhone, setDriverPhone] = useState<string>('9825112233');
  const [dispatchItems, setDispatchItems] = useState<any[]>([
    { itemId: '', quantityDispatched: 100, unit: 'PACKET', batchNumber: 'BAL-2026-OCT-B12' },
  ]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadMasterData() {
      try {
        const [awcRes, itemsRes] = await Promise.all([
          apiFetch('/api/awc'),
          apiFetch('/api/items'),
        ]);
        setAwcs(awcRes.awcs || []);
        if (awcRes.awcs?.length > 0) {
          setDestinationAwcId(awcRes.awcs[0].id);
        }
        setItems(itemsRes.items || []);
        if (itemsRes.items?.length > 0) {
          setDispatchItems([
            {
              itemId: itemsRes.items[0].id,
              quantityDispatched: 100,
              unit: itemsRes.items[0].unit,
              batchNumber: 'BAL-2026-OCT-B12',
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load master data:', err);
      }
    }
    loadMasterData();
  }, []);

  const handleAddItem = () => {
    if (items.length === 0) return;
    setDispatchItems((prev) => [
      ...prev,
      { itemId: items[0].id, quantityDispatched: 50, unit: items[0].unit, batchNumber: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setDispatchItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateDispatchItem = (index: number, field: string, value: any) => {
    setDispatchItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'itemId') {
        const it = items.find((i) => i.id === value);
        if (it) next[index].unit = it.unit;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationAwcId) return;

    setError('');
    setSubmitting(true);

    try {
      await apiFetch('/api/dispatches', {
        method: 'POST',
        body: JSON.stringify({
          challanNumber,
          destinationAwcId,
          vehicleNumber,
          driverName,
          driverPhone,
          items: dispatchItems,
        }),
      });

      setSuccess(true);
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      setError(err.message || 'Error creating dispatch');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm text-center">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Supplier Dispatch Manifest Created!
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          Challan <span className="font-bold font-mono">{challanNumber}</span> has been dispatched. Destination AWW notified.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigate('/dispatches')}
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            View All Dispatches →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('actionBack')}</span>
        </button>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Supplier Dispatch Creation
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-7">
        <div className="flex items-start space-x-3 pb-4 border-b border-slate-100 mb-5">
          <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 font-sans">
              Create Supply Delivery Manifest
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Issue an official delivery challan to an Anganwadi Centre with tracked batch and vehicle details.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Destination Anganwadi Centre *
              </label>
              <select
                value={destinationAwcId}
                onChange={(e) => setDestinationAwcId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
              >
                {awcs.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nameEn} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Delivery Challan Number *
              </label>
              <input
                type="text"
                required
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Driver Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Driver Phone
              </label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-mono"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Dispatched Line Items
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-forest-700 hover:text-forest-800 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {dispatchItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Item
                  </label>
                  <select
                    value={item.itemId}
                    onChange={(e) => updateDispatchItem(idx, 'itemId', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {language === 'gu' ? it.nameGu : it.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <QuantityStepper
                    label="Dispatched Quantity"
                    value={item.quantityDispatched}
                    onChange={(v) => updateDispatchItem(idx, 'quantityDispatched', v)}
                    min={1}
                    unit={item.unit}
                    size="sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Batch #
                  </label>
                  <input
                    type="text"
                    value={item.batchNumber}
                    onChange={(e) => updateDispatchItem(idx, 'batchNumber', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                    placeholder="Batch"
                  />
                </div>

                <div className="sm:col-span-1 text-right sm:pt-4">
                  {dispatchItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-forest-700 hover:bg-forest-800 text-white font-bold rounded-xl text-xs transition shadow-sm"
          >
            {submitting ? 'Creating Dispatch...' : 'Confirm Dispatch & Send Manifest'}
          </button>
        </form>
      </div>
    </div>
  );
};
