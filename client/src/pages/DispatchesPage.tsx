import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { Truck, Plus, PackageCheck, Calendar, ArrowRight } from 'lucide-react';

export const DispatchesPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDispatches() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/dispatches');
        setDispatches(res.dispatches || []);
      } catch (err) {
        console.error('Failed to load dispatches:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDispatches();
  }, [user]);

  const canCreate = user?.role === 'SUPPLIER' || user?.role === 'CDPO';

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-forest-700" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans">
              {t('navDispatches')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supplier dispatch manifests and delivery challans tracking movement to Anganwadi Centres.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => navigate('/create-dispatch')}
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Dispatch</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {dispatches.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No dispatches found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dispatches.map((d) => (
              <div
                key={d.id}
                className="p-4 sm:p-5 hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-extrabold text-slate-900">
                      {d.dispatchNumber}
                    </span>
                    <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                      Challan: {d.challanNumber}
                    </span>
                    <StatusBadge status={d.status} size="sm" />
                  </div>

                  <div className="text-xs text-slate-700 font-semibold mt-1.5">
                    Destination: <span className="font-bold">{d.destinationAwc?.nameEn}</span> · Supplier:{' '}
                    <span className="text-forest-700">{d.supplier?.nameEn}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {d.items?.map((it: any) => (
                      <span
                        key={it.id}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-forest-50 text-forest-800 border border-forest-100"
                      >
                        {language === 'gu' ? it.item?.nameGu : it.item?.nameEn}: {it.quantityDispatched} {it.unit}
                      </span>
                    ))}
                  </div>

                  {d.vehicleNumber && (
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-2">
                      <span>Vehicle: {d.vehicleNumber}</span>
                      {d.driverName && <span>· Driver: {d.driverName} ({d.driverPhone})</span>}
                    </div>
                  )}
                </div>

                {user?.role === 'AWW' && (d.status === 'DISPATCHED' || d.status === 'PARTIALLY_RECEIVED') && (
                  <button
                    onClick={() => navigate('/receive-stock')}
                    className="px-3.5 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5 self-start sm:self-center"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Verify & Receive →</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
