import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SectionHeader } from '../components/SectionHeader';
import { ReportsModal } from '../components/modals/ReportsModal';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Boxes,
  ArrowRight,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'MPR' | 'DISPATCH_VS_RECEIPT' | 'CAG_AUDIT'>('MPR');
  const [mprData, setMprData] = useState<any | null>(null);
  const [month, setMonth] = useState<string>('2026-10');
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const targetAwcId = user?.awcId || '24190101';
      const awcRes = await apiFetch('/api/awc');
      const firstAwcId = user?.awcId || awcRes.awcs?.[0]?.id;
      if (firstAwcId) {
        const res = await apiFetch(`/api/reports/mpr?awcId=${firstAwcId}&month=${month}`);
        setMprData(res.mpr);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user, month]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (mprData) {
      let csv = 'Item Code,Item Name,Opening Balance,Total Received,Distributed/Consumed,Approved Spoilage,Closing Balance,Unit\n';
      mprData.itemReports?.forEach((r: any) => {
        csv += `"${r.item.code}","${r.item.nameEn}",${r.opening},${r.received},${r.issued},${r.spoiled},${r.closing},"${r.unit}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MPR_${month}.csv`;
      a.click();
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-cream-100 select-none">
      {/* SECTION HEADER (Pastel Mint) */}
      <SectionHeader
        title={language === 'gu' ? 'રિપોર્ટ અને MPR' : 'Reports & MPR'}
        englishTitle="MONTHLY PROGRESS & AUDIT REPORTS"
        icon={FileText}
        bgColor="bg-pastel-mint"
        borderColor="border-[#8CEFDA]"
        iconColor="text-pastel-mintIcon"
        actionButton={
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 border-2 border-[#E0D5C3] text-brand-navy font-black text-xs transition active:scale-95 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.2] text-pastel-mintIcon" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReportsModalOpen(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-pastel-mint hover:bg-pastel-mintHover border-2 border-[#8CEFDA] text-pastel-mintIcon font-black text-xs transition active:scale-95 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <FileText className="w-4 h-4 stroke-[2.2]" />
              <span>{language === 'gu' ? '+ MPR પોપઅપ' : '+ Inspect MPR'}</span>
            </button>
          </div>
        }
      />

      {/* SECTION CONTENT: Metrics and MPR Item Summary Table */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-mint/60 border border-[#8CEFDA] text-pastel-mintIcon flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'રિપોર્ટ મહિનો' : 'Active Month'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                ઓક્ટોબર 2026
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'MPR સ્થિતિ' : 'MPR Status'}
              </div>
              <div className="text-xs sm:text-sm font-black text-emerald-800 uppercase">
                ઓટો-રિકન્સાઈલ્ડ
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-blue/60 border border-[#ADC4FA] text-pastel-blueIcon flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'ઓડિટ સુસંગતતા' : 'CAG Audit'}
              </div>
              <div className="text-xs sm:text-sm font-black text-brand-navy">
                100% સુસંગત
              </div>
            </div>
          </div>
        </div>

        {/* MPR Report Table with prominent borders */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E0D5C3] mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-brand-navy font-sans">
                {language === 'gu' ? 'માસિક પ્રગતિ પત્રક (Monthly Progress Report - MPR)' : 'Monthly Progress Report (MPR)'}
              </h2>
              <p className="text-xs text-brand-navy/60 mt-0.5">
                સત્તાવાર ICDS પોષણ વિતરણ અને સ્ટોક સંતુલન પત્રક
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsReportsModalOpen(true)}
              className="text-xs font-black text-pastel-mintIcon hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>વિગતવાર પોપઅપ</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs font-bold text-brand-navy/50">
              અહેવાલ ડેટા લોડ થઈ રહ્યો છે...
            </div>
          ) : !mprData ? (
            <div className="text-center py-8 text-xs text-brand-navy/50">
              કોઈ MPR ડેટા મળ્યો નથી.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-[#E0D5C3] text-xs">
                <thead>
                  <tr className="bg-cream-200/60 font-black text-brand-navy text-left">
                    <th className="py-2.5 px-3">સામગ્રી (Item)</th>
                    <th className="py-2.5 px-3">શરૂઆતનો સ્ટોક (Opening)</th>
                    <th className="py-2.5 px-3">આવક જથ્થો (Received)</th>
                    <th className="py-2.5 px-3">વિતરણ/વપરાશ (Issued)</th>
                    <th className="py-2.5 px-3">બગાડ (Spoiled)</th>
                    <th className="py-2.5 px-3">આખર સ્ટોક (Closing)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0D5C3] font-bold text-brand-navy">
                  {mprData.itemReports?.map((r: any, idx: number) => (
                    <tr
                      key={idx}
                      onClick={() => setIsReportsModalOpen(true)}
                      className="hover:bg-pastel-mint/20 cursor-pointer transition"
                    >
                      <td className="py-2 px-3">
                        <div className="font-black">
                          {language === 'gu' ? r.item.nameGu : r.item.nameEn}
                        </div>
                        <div className="text-[10px] text-brand-navy/50">{r.item.code}</div>
                      </td>
                      <td className="py-2 px-3">{r.opening} {r.unit}</td>
                      <td className="py-2 px-3 text-emerald-700">+{r.received} {r.unit}</td>
                      <td className="py-2 px-3 text-brand-navy">-{r.issued} {r.unit}</td>
                      <td className="py-2 px-3 text-rose-700">{r.spoiled > 0 ? `-${r.spoiled}` : '0'} {r.unit}</td>
                      <td className="py-2 px-3 font-black text-brand-navy">{r.closing} {r.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* POPUP: ReportsModal with clear distributive mint border */}
      <ReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
      />
    </div>
  );
};
