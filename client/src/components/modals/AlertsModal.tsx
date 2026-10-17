import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ModalWrapper } from '../ModalWrapper';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReceipt?: () => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  onOpenReceipt,
}) => {
  const { user, apiFetch } = useAuth();
  const { language, t } = useLanguage();

  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function loadAlerts() {
      try {
        setLoading(true);
        const res = await apiFetch('/api/discrepancies?status=OPEN');
        setDiscrepancies(res.discrepancies || []);
      } catch (err) {
        console.error('Failed to load discrepancies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, [isOpen]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'gu' ? 'ચેતવણીઓ અને વિસંગતતાઓ' : 'Alerts & Discrepancies'}
      subtitle={
        language === 'gu'
          ? 'જથ્થા તફાવત, નુકસાન અને સુપરવાઇઝર નોંધની યાદી'
          : 'Pending shortages, damages, and audit alerts'
      }
      englishTitle="ALERTS"
      icon={Bell}
      iconColor="text-pastel-pinkIcon"
      bgColor="bg-pastel-pink"
      borderColor="border-[#F8B4BA]"
      maxWidth="2xl"
      footerActions={
        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition active:scale-95"
          >
            {language === 'gu' ? 'બંધ કરો' : 'Close'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500 font-bold">
            {language === 'gu' ? 'ચેતવણીઓ તપાસાઈ રહી છે...' : 'Checking alerts...'}
          </div>
        ) : discrepancies.length === 0 ? (
          <div className="p-8 bg-[#FFF0F2] rounded-2xl border border-[#FCD6DB] text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="text-sm font-black text-brand-navy">
              {language === 'gu' ? 'બધું બરાબર છે!' : 'All Clear!'}
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {language === 'gu'
                ? 'તમારા કેન્દ્ર પર કોઈ સક્રિય વિસંગતતા કે સ્ટોક ચેતવણી નથી.'
                : 'No open discrepancies or shortage alerts reported at this centre.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {discrepancies.map((disc) => (
              <div
                key={disc.id}
                className="p-3.5 bg-[#FFF0F2] rounded-2xl border border-[#FCD6DB] shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="text-xs font-black text-brand-navy">
                      {disc.type === 'DELIVERY_SHORTAGE'
                        ? language === 'gu'
                          ? 'ડિલિવરીમાં ઓછો જથ્થો'
                          : 'Delivery Shortage'
                        : disc.type === 'DELIVERY_DAMAGE'
                        ? language === 'gu'
                          ? 'બગડેલ / તૂટેલ જથ્થો'
                          : 'Damaged Delivery'
                        : disc.type}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                    {language === 'gu' ? 'બાકી' : 'OPEN'}
                  </span>
                </div>

                <div className="text-xs text-slate-600">
                  {disc.item
                    ? language === 'gu'
                      ? disc.item.nameGu
                      : disc.item.nameEn
                    : 'Ration'}{' '}
                  · {language === 'gu' ? 'તફાવત:' : 'Variance:'}{' '}
                  <span className="font-bold text-rose-600">
                    {disc.quantityDiscrepancy} {disc.unit || 'units'}
                  </span>
                </div>

                {disc.notes && (
                  <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-xl">
                    "{disc.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
