import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Truck, ChevronRight, CheckCircle2 } from 'lucide-react';

interface DeliveryPreviewCardProps {
  dispatches: any[];
  onReceive: (dispatch?: any) => void;
  onViewAll?: () => void;
}

export const DeliveryPreviewCard: React.FC<DeliveryPreviewCardProps> = ({
  dispatches,
  onReceive,
  onViewAll,
}) => {
  const { language } = useLanguage();

  const count = dispatches.length;
  const latestDispatch = dispatches[0];

  return (
    <div className="w-full bg-[#FFF5EA] border border-[#F6D7B8] rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-tile select-none min-h-0">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-1.5 sm:mb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-pastel-peach text-pastel-peachIcon flex items-center justify-center flex-shrink-0 shadow-xs border border-white">
            <Truck className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs sm:text-sm font-black text-brand-navy">
              {language === 'gu' ? 'આજની ડિલિવરી' : "Today's Deliveries"}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-brand-orange border border-[#F6D7B8] shadow-2xs">
              {count}
            </span>
          </div>
        </div>

        {count > 1 && onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[11px] font-bold text-brand-orange hover:text-brand-orangeLight flex items-center space-x-0.5"
          >
            <span>{language === 'gu' ? 'બધી જુઓ' : 'View all'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {count > 0 && latestDispatch ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-white/85 border border-[#FDE5CC]">
          <div className="min-w-0">
            <div className="text-xs font-black text-brand-navy truncate">
              {latestDispatch.supplier
                ? language === 'gu'
                  ? latestDispatch.supplier.nameGu
                  : latestDispatch.supplier.nameEn
                : language === 'gu'
                ? 'અમૂલ ફેડરેશન'
                : 'Amul Federation'}{' '}
              <span className="text-slate-400 font-mono text-[11px]">
                · #{latestDispatch.challanNumber || latestDispatch.dispatchNumber || 'DISP-9021'}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 truncate mt-0.5">
              {latestDispatch.items && latestDispatch.items.length > 0
                ? latestDispatch.items
                    .map((item: any) => {
                      const name = item.item
                        ? language === 'gu'
                          ? item.item.nameGu
                          : item.item.nameEn
                        : item.itemId || 'રાશન';
                      return `${name} (${item.dispatchedQuantity} ${item.unit || 'પાઉચ'})`;
                    })
                    .join(', ')
                : language === 'gu'
                ? 'બાલશક્તિ (150 પાઉચ), માતૃશક્તિ (50 પાઉચ)'
                : 'Balshakti (150 pouches), Matrushakti (50 pouches)'}
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onReceive(latestDispatch)}
              className="px-3 py-1.5 rounded-xl bg-brand-orange hover:bg-brand-orangeLight text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center space-x-1 cursor-pointer"
            >
              <span>{language === 'gu' ? 'મળ્યો દાખલ કરો →' : 'Receive Now →'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2 py-1 text-slate-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-xs font-medium">
            {language === 'gu'
              ? 'આજે કોઈ નવી ડિલિવરી બાકી નથી. તમામ સ્ટોક અદ્યતન છે.'
              : 'No pending deliveries today. All stock is up to date.'}
          </span>
        </div>
      )}
    </div>
  );
};
