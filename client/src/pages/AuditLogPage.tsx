import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { apiFetch } = useAuth();
  const { t } = useLanguage();

  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAudit() {
      try {
        setLoading(true);
        let query = '?limit=50';
        if (selectedEntity) query += `&entityType=${selectedEntity}`;
        const res = await apiFetch(`/api/audit${query}`);
        setLogs(res.logs || []);
        setTotal(res.total || 0);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAudit();
  }, [selectedEntity]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-forest-700" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans">
              {t('navAuditLog')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, append-only log of every system transaction, delivery verification, and supervisory decision.
          </p>
        </div>

        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white font-medium"
        >
          <option value="">All Entities (તમામ બાબતો)</option>
          <option value="RECEIPT">Delivery Receipts</option>
          <option value="DISPATCH">Supplier Dispatches</option>
          <option value="THR_DISTRIBUTION">THR Distributions</option>
          <option value="HCM_SERVICE">HCM Meal Services</option>
          <option value="PHYSICAL_COUNT">Physical Counts</option>
          <option value="DISCREPANCY">Discrepancy Actions</option>
          <option value="WRITE_OFF">Write-Off Approvals</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No audit logs recorded for selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">AWC Centre</th>
                  <th className="py-3 px-4">Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleDateString([], {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.actorUser?.fullNameEn}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-forest-700">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {log.awc?.nameEn || 'System Scope'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {log.reasonCode || log.newValueJson || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
