import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SectionHeader } from '../components/SectionHeader';
import { ReceiveStockModal } from '../components/modals/ReceiveStockModal';
import {
  PackageCheck,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  Boxes,
  ArrowRight,
} from 'lucide-react';

export const DeliveryReceiptPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();

  const [dispatches, setDispatches] = useState<any[]>([]);
  const [allDispatches, setAllDispatches] = useState<any[]>([]);
  const [selectedDispatchForModal, setSelectedDispatchForModal] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDispatches = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/dispatches');
      const all = res.dispatches || [];
      setAllDispatches(all);
      const pending = all.filter(
        (d: any) => d.status === 'DISPATCHED' || d.status === 'PARTIALLY_RECEIVED'
      );
      setDispatches(pending);
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, []);

  const openReceiptPopup = (dispatch?: any) => {
    setSelectedDispatchForModal(dispatch || dispatches[0] || null);
    setIsReceiptModalOpen(true);
  };

  const handleReceiptSuccess = () => {
    loadDispatches();
  };

  const completedReceipts = allDispatches.filter(
    (d: any) => d.status === 'RECEIVED'
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-cream-100 select-none">
      {/* SECTION HEADER (Pastel Pink) */}
      <SectionHeader
        title={language === 'gu' ? 'સ્ટોક મેળવો' : 'Receive Stock'}
        englishTitle="RECEIVE STOCK & CHALLAN AUDIT"
        icon={PackageCheck}
        bgColor="bg-pastel-pink"
        borderColor="border-[#F8B4BA]"
        iconColor="text-pastel-pinkIcon"
        actionButton={
          <button
            type="button"
            onClick={() => openReceiptPopup()}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-pastel-pink hover:bg-pastel-pinkHover border-2 border-[#F8B4BA] text-pastel-pinkIcon font-black text-xs transition active:scale-95 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <PackageCheck className="w-4 h-4 stroke-[2.2]" />
            <span>{language === 'gu' ? '+ જથ્થો સ્વીકારો' : '+ Receive Stock'}</span>
          </button>
        }
      />

      {/* SECTION CONTENT: Clean, bounded overview with clear borders */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-pink/60 border border-[#F8B4BA] text-pastel-pinkIcon flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'પેન્ડિંગ ડિલિવરી' : 'Pending Shipments'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                {dispatches.length}
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'સ્વીકારેલ ચલણ' : 'Verified Receipts'}
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-800">
                {completedReceipts.length}
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-peach/60 border border-[#FDC58A] text-pastel-peachIcon flex items-center justify-center flex-shrink-0">
              <Boxes className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'ચલણ વિસંગતતા' : 'Discrepancy Alerts'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-orange">
                {allDispatches.filter((d) => d.status === 'PARTIALLY_RECEIVED').length}
              </div>
            </div>
          </div>
        </div>

        {/* Incoming Dispatches List (Interactive Cards opening Popup) */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E0D5C3] mb-3">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-pastel-pinkIcon stroke-[2.2]" />
              <h2 className="text-sm sm:text-base font-black text-brand-navy font-sans">
                {language === 'gu' ? 'આગમન પાત્ર ડિલિવરી (ચકાસણી માટે ઉપલબ્ધ)' : 'Incoming Shipments for Verification'}
              </h2>
            </div>
            <span className="text-xs font-bold text-brand-navy/60">
              {dispatches.length} {language === 'gu' ? 'ચલણ બાકી' : 'Pending'}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs font-bold text-brand-navy/50">
              ડિસ્પેચ યાદી લોડ થઈ રહી છે...
            </div>
          ) : dispatches.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-pastel-pink/30 border-2 border-dashed border-[#F8B4BA] my-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 stroke-[2.2]" />
              <div className="text-sm font-black text-brand-navy">
                {language === 'gu' ? 'તમામ ડિલિવરી ચકાસાઈ ગયેલ છે!' : 'All Incoming Shipments Verified!'}
              </div>
              <div className="text-xs text-brand-navy/60 mt-0.5">
                {language === 'gu' ? 'હાલમાં કોઈ નવો ડિસ્પેચ પેન્ડિંગ નથી.' : 'No pending shipments awaiting verification.'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {dispatches.map((disp) => (
                <div
                  key={disp.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-[#FFFDF9] border-2 border-[#E0D5C3] hover:border-[#F8B4BA] transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  onClick={() => openReceiptPopup(disp)}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-pastel-pink text-pastel-pinkIcon border border-[#F8B4BA]">
                        ચલણ #{disp.challanNumber}
                      </span>
                      <span className="text-xs font-black text-brand-navy truncate">
                        {disp.supplier?.name || 'GCDC Supplier'}
                      </span>
                      {disp.vehicleNumber && (
                        <span className="text-[11px] text-brand-navy/60 font-semibold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          વાહન: {disp.vehicleNumber}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-brand-navy/70 flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-navy/50" />
                        <span>{new Date(disp.dispatchedAt).toLocaleDateString('gu-IN')}</span>
                      </span>
                      <span>·</span>
                      <span className="font-bold text-brand-navy">
                        {disp.items?.length || 0} પ્રકારનો જથ્થો
                      </span>
                    </div>

                    {/* Items chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {disp.items?.slice(0, 3).map((it: any, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-cream-200 text-brand-navy text-[10px] font-bold border border-[#E0D5C3]"
                        >
                          {language === 'gu' ? it.item?.nameGu : it.item?.nameEn}: {it.quantityDispatched} {it.unit}
                        </span>
                      ))}
                      {disp.items?.length > 3 && (
                        <span className="text-[10px] text-brand-navy/50 font-bold self-center">
                          +{disp.items.length - 3} વધુ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      ચકાસણી બાકી
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReceiptPopup(disp);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-pastel-pink hover:bg-pastel-pinkHover text-pastel-pinkIcon font-black text-xs border border-[#F8B4BA] transition active:scale-95 flex items-center space-x-1 shadow-2xs group-hover:scale-105"
                    >
                      <span>ચકાસો અને સ્વીકારો</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Received Dispatches History */}
        {completedReceipts.length > 0 && (
          <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
            <h3 className="text-xs sm:text-sm font-black text-brand-navy uppercase tracking-wider mb-3">
              {language === 'gu' ? 'છેલ્લા સ્વીકારેલ ચલણ ઇતિહાસ' : 'Recent Verified Delivery Receipts'}
            </h3>
            <div className="divide-y divide-[#E0D5C3]">
              {completedReceipts.slice(0, 5).map((rec) => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-brand-navy">#{rec.challanNumber}</span>
                    <span className="text-brand-navy/60 ml-2">
                      {new Date(rec.dispatchedAt).toLocaleDateString('gu-IN')}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    પૂર્ણ સ્વીકૃતિ (VERIFIED)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* POPUP: ReceiveStockModal with clear distributive pastel border */}
      <ReceiveStockModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        preselectedDispatch={selectedDispatchForModal}
        onSuccess={handleReceiptSuccess}
      />
    </div>
  );
};
