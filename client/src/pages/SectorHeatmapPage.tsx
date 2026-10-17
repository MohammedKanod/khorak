import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { MapPin, AlertTriangle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export const SectorHeatmapPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [filterColor, setFilterColor] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHeatmap() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/awc/overview/heatmap');
        setHeatmapData(res.heatmap || []);
        setSummary(res.summary || null);
      } catch (err) {
        console.error('Failed to load heatmap:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHeatmap();
  }, [user]);

  const filtered = heatmapData.filter(
    (h) => filterColor === 'ALL' || h.statusColor === filterColor
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-forest-700" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans">
              {t('navHeatmap')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time sector health map monitoring low stock, unacknowledged deliveries, and open discrepancies across AWCs.
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterColor('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterColor === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              All ({summary.total})
            </button>
            <button
              onClick={() => setFilterColor('GREEN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterColor === 'GREEN'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              Normal ({summary.green})
            </button>
            <button
              onClick={() => setFilterColor('AMBER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterColor === 'AMBER'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              Attention ({summary.amber})
            </button>
            <button
              onClick={() => setFilterColor('RED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterColor === 'RED'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              Critical ({summary.red})
            </button>
          </div>
        )}
      </div>

      {/* Heatmap Grid of AWCs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((awc) => {
          let cardBorder = 'border-slate-200';
          let statusBg = 'bg-emerald-50 text-emerald-700';

          if (awc.statusColor === 'RED') {
            cardBorder = 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20';
            statusBg = 'bg-rose-100 text-rose-800 font-bold';
          } else if (awc.statusColor === 'AMBER') {
            cardBorder = 'border-amber-300 ring-1 ring-amber-300 bg-amber-50/20';
            statusBg = 'bg-amber-100 text-amber-800 font-bold';
          }

          return (
            <div
              key={awc.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition hover:shadow-md ${cardBorder}`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{awc.nameEn}</h3>
                    <div className="text-[11px] text-slate-400 font-mono">Code: {awc.code}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${statusBg}`}>
                    {awc.statusColor}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <div>
                    Sector: <span className="font-semibold text-slate-800">{awc.sectorName}</span>
                  </div>
                  <div>
                    Beneficiaries: <span className="font-semibold text-slate-800">{awc.enrolledBeneficiariesCount} enrolled</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="font-semibold text-slate-700 flex items-center space-x-1">
                    {awc.statusColor === 'GREEN' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>{awc.statusReason}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  {awc.lastUpdate
                    ? `Last active: ${new Date(awc.lastUpdate).toLocaleDateString([], { day: '2-digit', month: 'short' })}`
                    : 'No recent activity'}
                </span>

                {awc.openDiscrepanciesCount > 0 && (
                  <button
                    onClick={() => navigate('/discrepancies')}
                    className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center space-x-1"
                  >
                    <span>Inspect Issues</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
