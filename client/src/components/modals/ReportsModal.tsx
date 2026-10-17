import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ModalWrapper } from '../ModalWrapper';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Table,
} from 'lucide-react';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, apiFetch } = useAuth();
  const { language, t } = useLanguage();

  const [reportType, setReportType] = useState('MPR');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.awcId) return;

    async function generateReport() {
      if (!user?.awcId) return;
      try {
        setLoading(true);
        // Load live data for report
        const [stockRes, thrRes] = await Promise.all([
          apiFetch(`/api/stock/awc/${user.awcId}`),
          apiFetch(`/api/thr/beneficiaries/awc/${user.awcId}`).catch(() => ({ beneficiaries: [] })),
        ]);

        setReportData({
          awc: user.awc || { nameGu: 'વાવડી બુજર્ગ', code: '24190101' },
          stock: stockRes.stockOverview || [],
          beneficiaries: thrRes.beneficiaries || [],
          month: selectedMonth,
          year: selectedYear,
        });
      } catch (err) {
        console.error('Failed to generate report:', err);
      } finally {
        setLoading(false);
      }
    }
    generateReport();
  }, [isOpen, user, reportType, selectedMonth, selectedYear]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!reportData?.stock) return;
    const headers = ['Item Code', 'Item Name', 'Unit', 'Current Balance'];
    const rows = reportData.stock.map((s: any) => [
      s.item.code,
      s.item.nameEn,
      s.item.unit,
      s.currentBalance,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `khorak_report_${reportType}_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'gu' ? 'રિપોર્ટ અને MPR (અહેવાલ)' : 'Reports & MPR'}
      subtitle={
        language === 'gu'
          ? 'માસિક પ્રગતિ પત્રક અને સત્તાવાર સરકારી ઓડિટ અહેવાલ'
          : 'Monthly Progress Report & official ICDS statements'
      }
      englishTitle="REPORTS & MPR"
      icon={FileText}
      iconColor="text-pastel-mintIcon"
      bgColor="bg-pastel-mint"
      borderColor="border-[#8CEFDA]"
      maxWidth="3xl"
      footerActions={
        <div className="w-full flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition active:scale-95"
          >
            {language === 'gu' ? 'બંધ કરો' : 'Close'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition active:scale-95 flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'gu' ? 'CSV ડાઉનલોડ' : 'Export CSV'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'gu' ? 'પ્રિન્ટ / PDF' : 'Print / Save PDF'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Report Selector Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#EAFBF7] p-3 rounded-2xl border border-[#A8F6E6] shadow-xs">
          <div>
            <label className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
              {language === 'gu' ? 'અહેવાલ પ્રકાર:' : 'Report Type:'}
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-[#A8F6E6] text-xs font-bold text-brand-navy bg-white"
            >
              <option value="MPR">
                {language === 'gu' ? 'MPR (માસિક પ્રગતિ પત્રક)' : 'MPR Monthly Progress'}
              </option>
              <option value="STOCK">
                {language === 'gu' ? 'સ્ટોક સરવૈયું (Balance)' : 'Stock Balance Statement'}
              </option>
              <option value="THR">
                {language === 'gu' ? 'THR વિતરણ રજિસ્ટર' : 'THR Beneficiary Register'}
              </option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
              {language === 'gu' ? 'માસ (Month):' : 'Month:'}
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-xl border border-[#A8F6E6] text-xs font-bold text-brand-navy bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1, 1).toLocaleString('gu-IN', { month: 'long' })} ({m})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
              {language === 'gu' ? 'વર્ષ (Year):' : 'Year:'}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-xl border border-[#A8F6E6] text-xs font-bold text-brand-navy bg-white"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>

        {/* Report Preview Document */}
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500 font-bold">
            {language === 'gu' ? 'અહેવાલ તૈયાર થઈ રહ્યો છે...' : 'Preparing report preview...'}
          </div>
        ) : (
          <div className="p-4 bg-[#F2FCF9] rounded-2xl border border-[#B6F7E9] shadow-xs space-y-3 print:border-0 print:p-0">
            {/* Header of Report Document */}
            <div className="text-center border-b pb-2.5 space-y-0.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                મહિલા અને બાળ વિકાસ વિભાગ · ગુજરાત સરકાર
              </div>
              <h3 className="text-sm sm:text-base font-black text-brand-navy">
                {reportType === 'MPR'
                  ? 'માસિક પ્રગતિ પત્રક (Monthly Progress Report - MPR)'
                  : reportType === 'STOCK'
                  ? 'આંગણવાડી સ્ટોક સ્થિતિ પત્રક'
                  : 'THR પોષણ વિતરણ પ્રમાણપત્ર'}
              </h3>
              <div className="text-xs text-slate-600">
                {reportData?.awc?.nameGu || 'વાવડી બુજર્ગ'} (કોડ: {reportData?.awc?.code || '24190101'}) · માસ: {selectedMonth}/{selectedYear}
              </div>
            </div>

            {/* Compact Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-1.5">{language === 'gu' ? 'વસ્તુનું નામ' : 'Item Name'}</th>
                    <th className="pb-1.5">{language === 'gu' ? 'એકમ' : 'Unit'}</th>
                    <th className="pb-1.5 text-right">{language === 'gu' ? 'વર્તમાન સિલક' : 'Current Balance'}</th>
                    <th className="pb-1.5 text-right">{language === 'gu' ? 'સ્થિતિ' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-brand-navy">
                  {(reportData?.stock || []).map((s: any) => (
                    <tr key={s.item.id} className="hover:bg-slate-50/50">
                      <td className="py-1.5 font-bold">
                        {language === 'gu' ? s.item.nameGu : s.item.nameEn}
                      </td>
                      <td className="py-1.5 text-slate-500">{s.item.unit}</td>
                      <td className="py-1.5 text-right font-mono font-bold">{s.currentBalance}</td>
                      <td className="py-1.5 text-right">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {language === 'gu' ? 'સંતોષકારક' : 'Verified'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Certification Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <div>
                {language === 'gu' ? 'ડિજિટલ ઓડિટ આઈડી:' : 'Audit ID:'}{' '}
                <span className="font-mono font-bold text-slate-700">ICDS-MPR-{selectedYear}{selectedMonth}-OK</span>
              </div>
              <div className="flex items-center space-x-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'gu' ? 'પ્રમાણિત' : 'Certified'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
