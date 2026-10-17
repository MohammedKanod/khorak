import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  englishTitle?: string;
  icon: LucideIcon;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  actionButton?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  englishTitle,
  icon: Icon,
  bgColor,
  borderColor,
  iconColor,
  actionButton,
}) => {
  const navigate = useNavigate();
  return (
    <div className="w-full bg-[#FAF3E8]/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border-2 border-[#E0D5C3] flex items-center justify-between gap-2 shadow-xs mb-2 sm:mb-3 flex-shrink-0">
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-slate-100 border border-[#DCD0BE] text-brand-navy transition active:scale-95 flex items-center space-x-1.5 flex-shrink-0 shadow-2xs"
          title="પાછા જાઓ (Home Dashboard)"
        >
          <ArrowLeft className="w-4 h-4 text-brand-navy stroke-[2.2]" />
          <span className="text-xs font-bold hidden sm:inline text-brand-navy">
            મુખ્ય પેજ (Home)
          </span>
        </button>

        {/* Section Badge with signature pastel color & border */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl ${bgColor} ${borderColor} border-2 shadow-2xs min-w-0`}
        >
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor} flex-shrink-0 stroke-[2.2]`} />
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-black text-brand-navy truncate block leading-tight font-sans">
              {title}
            </span>
            {englishTitle && (
              <span className="text-[9px] sm:text-[10px] text-brand-navy/60 uppercase font-bold tracking-wider leading-none block">
                {englishTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {actionButton && <div className="flex-shrink-0">{actionButton}</div>}
    </div>
  );
};
