import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SectionHeader } from '../components/SectionHeader';
import { WriteOffModal } from '../components/modals/WriteOffModal';
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const WriteOffPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();

  const [writeOffs, setWriteOffs] = useState<any[]>([]);
  const [isWriteOffModalOpen, setIsWriteOffModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/write-off');
      setWriteOffs(res.writeOffs || []);
    } catch (err) {
      console.error('Failed to load write-off data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const pendingCount = writeOffs.filter((w) => w.status === 'PENDING').length;
  const approvedCount = writeOffs.filter((w) => w.status === 'APPROVED').length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-cream-100 select-none">
      {/* SECTION HEADER (Pastel Purple) */}
      <SectionHeader
        title={language === 'gu' ? 'બગાડ / નુકસાન' : 'Damage / Spoilage'}
        englishTitle="DAMAGE & SPOILAGE WRITE-OFF"
        icon={TrendingDown}
        bgColor="bg-pastel-purple"
        borderColor="border-[#F4A9EE]"
        iconColor="text-pastel-purpleIcon"
        actionButton={
          <button
            type="button"
            onClick={() => setIsWriteOffModalOpen(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-pastel-purple hover:bg-pastel-purpleHover border-2 border-[#F4A9EE] text-pastel-purpleIcon font-black text-xs transition active:scale-95 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <TrendingDown className="w-4 h-4 stroke-[2.2]" />
            <span>{language === 'gu' ? '+ નુકસાન નોંધો' : '+ Report Damage'}</span>
          </button>
        }
      />

      {/* SECTION CONTENT: Metrics and Incident Logs */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-purple/60 border border-[#F4A9EE] text-pastel-purpleIcon flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'કુલ કેસો' : 'Total Incidents'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                {writeOffs.length}
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'સુપરવાઇઝર પેન્ડિંગ' : 'Pending Review'}
              </div>
              <div className="text-base sm:text-xl font-black text-amber-800">
                {pendingCount}
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'મંજૂર થયેલ' : 'Approved'}
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-800">
                {approvedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Incident Logs List */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E0D5C3] mb-3">
            <h2 className="text-sm sm:text-base font-black text-brand-navy font-sans">
              {language === 'gu' ? 'બગાડ / નુકસાન અરજી પત્રક' : 'Damage Incidents Register'}
            </h2>
            <span className="text-xs font-bold text-brand-navy/60">
              {writeOffs.length} અરજીઓ
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs font-bold text-brand-navy/50">
              રેકોર્ડ્સ લોડ થઈ રહ્યા છે...
            </div>
          ) : writeOffs.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-pastel-purple/30 border-2 border-dashed border-[#F4A9EE] my-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 stroke-[2.2]" />
              <div className="text-sm font-black text-brand-navy">
                કોઈ બગાડ અથવા નુકસાન નોંધાયેલ નથી.
              </div>
              <div className="text-xs text-brand-navy/60 mt-0.5">
                તમામ જથ્થો સારી સ્થિતિમાં છે.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {writeOffs.map((wro) => (
                <div
                  key={wro.id}
                  onClick={() => setIsWriteOffModalOpen(true)}
                  className="p-3.5 sm:p-4 rounded-xl bg-[#FFFDF9] border-2 border-[#E0D5C3] hover:border-[#F4A9EE] transition shadow-2xs cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-brand-navy/60 uppercase">
                        {wro.item?.code}
                      </span>
                      <span className="text-sm font-black text-brand-navy">
                        {language === 'gu' ? wro.item?.nameGu : wro.item?.nameEn}
                      </span>
                    </div>
                    <div className="text-xs text-brand-navy/70">
                      કારણ: <span className="font-bold">{wro.reasonCode?.replace(/_/g, ' ')}</span>
                      {wro.explanation && ` · ${wro.explanation}`}
                    </div>
                    <div className="text-[11px] text-brand-navy/50">
                      તારીખ: {new Date(wro.createdAt).toLocaleDateString('gu-IN')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-left sm:text-right">
                      <span className="text-sm font-black text-rose-700">
                        -{wro.quantity} {wro.item?.unit}
                      </span>
                      <div>
                        {wro.status === 'APPROVED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            મંજૂર થયેલ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            સુપરવાઇઝર મંજૂરી બાકી
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsWriteOffModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-pastel-purple hover:bg-pastel-purpleHover text-pastel-purpleIcon font-black text-xs border border-[#F4A9EE] transition active:scale-95 flex items-center space-x-1 shadow-2xs group-hover:scale-105"
                    >
                      <span>વિગત</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* POPUP: WriteOffModal with clear distributive purple border */}
      <WriteOffModal
        isOpen={isWriteOffModalOpen}
        onClose={() => setIsWriteOffModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
