import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export const DiscrepanciesPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();

  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  const isSupervisorOrAbove =
    user?.role === 'SUPERVISOR' || user?.role === 'CDPO' || user?.role === 'DPO';

  const loadDiscrepancies = async () => {
    try {
      const url = filterStatus === 'ALL' ? '/api/discrepancies' : `/api/discrepancies?status=${filterStatus}`;
      const res = await apiFetch(url);
      setDiscrepancies(res.discrepancies || []);
    } catch (err) {
      console.error('Failed to load discrepancies:', err);
    }
  };

  useEffect(() => {
    loadDiscrepancies();
  }, [filterStatus]);

  const handleAction = async (action: 'APPROVE_ADJUSTMENT' | 'REQUEST_RECOUNT' | 'REJECT') => {
    if (!selectedCase) return;
    setSubmitting(true);
    setFeedback('');
    try {
      const res = await apiFetch(`/api/discrepancies/${selectedCase.id}/action`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          notes: actionNotes || `Supervisor decision: ${action}`,
        }),
      });

      setFeedback(res.message);
      setSelectedCase(null);
      setActionNotes('');
      loadDiscrepancies();
      confetti({ particleCount: 40, spread: 50 });
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans">
            {t('navDiscrepancies')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit-ready exception queue tracking short deliveries, damaged arrivals, and physical count variances.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'OPEN', 'RECOUNT_REQUESTED', 'APPROVED_ADJUSTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                filterStatus === st
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          {feedback}
        </div>
      )}

      {/* Discrepancies Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {discrepancies.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No discrepancies found matching the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Case #</th>
                  <th className="py-3 px-4">AWC Centre</th>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Expected</th>
                  <th className="py-3 px-4">Actual</th>
                  <th className="py-3 px-4">Variance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {discrepancies.map((disc) => (
                  <tr key={disc.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {disc.caseNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{disc.awc?.nameEn}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{disc.awc?.code}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {language === 'gu' ? disc.item?.nameGu : disc.item?.nameEn}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={disc.discrepancyType} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">{disc.expectedQuantity} {disc.unit}</td>
                    <td className="py-3.5 px-4">{disc.actualQuantity} {disc.unit}</td>
                    <td className="py-3.5 px-4 font-extrabold text-rose-700">
                      {disc.varianceQuantity} {disc.unit}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={disc.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedCase(disc);
                          setActionNotes('');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Resolution Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-slate-500">Case Details</span>
                <h3 className="text-base font-extrabold text-slate-900">{selectedCase.caseNumber}</h3>
              </div>
              <StatusBadge status={selectedCase.status} />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">AWC Centre:</span>
                <span className="font-bold text-slate-800">{selectedCase.awc?.nameEn}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Item:</span>
                <span className="font-bold text-slate-800">{selectedCase.item?.nameEn}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Expected Book Quantity:</span>
                <span className="font-bold text-slate-800">{selectedCase.expectedQuantity} {selectedCase.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Actual Physically Found:</span>
                <span className="font-bold text-slate-800">{selectedCase.actualQuantity} {selectedCase.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Variance:</span>
                <span className="font-extrabold text-rose-700">{selectedCase.varianceQuantity} {selectedCase.unit}</span>
              </div>
              {selectedCase.resolutionNotes && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 mt-2">
                  <span className="font-bold text-slate-700 block mb-0.5">Notes:</span>
                  <p className="text-slate-600">{selectedCase.resolutionNotes}</p>
                </div>
              )}
            </div>

            {/* Supervisor Action Interface */}
            {isSupervisorOrAbove && selectedCase.status === 'OPEN' && (
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Supervisor Action & Reason Notes *
                </label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Record supervisor verification notes and decision..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={submitting}
                    onClick={() => handleAction('APPROVE_ADJUSTMENT')}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                  >
                    ✓ Approve Adjustment
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleAction('REQUEST_RECOUNT')}
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                  >
                    ↻ Request Recount
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleAction('REJECT')}
                    className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
