import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SquareTileProps {
  title: string;
  subtitle?: string;
  englishTitle?: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  borderColor?: string;
  badge?: string | number | null;
  onClick: () => void;
  id?: string;
}

export const SquareTile: React.FC<SquareTileProps> = ({
  title,
  subtitle,
  englishTitle,
  icon: Icon,
  iconColor,
  bgColor,
  borderColor = 'border-white/60',
  badge,
  onClick,
  id,
}) => {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`relative w-full aspect-[1.02/1] sm:aspect-square ${bgColor} ${borderColor} border-2 rounded-2xl sm:rounded-3xl p-2 sm:p-4.5 flex flex-col justify-between items-start text-left shadow-tile hover:shadow-tile-hover transition-all duration-150 active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-brand-orange/50 cursor-pointer overflow-hidden group select-none min-h-0`}
    >
      {/* Top row: Large unmistakable icon + optional notification badge */}
      <div className="w-full flex items-start justify-between">
        <div
          className={`w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl flex items-center justify-center bg-white/70 shadow-sm backdrop-blur-xs transition-transform duration-150 group-hover:scale-105 ${iconColor}`}
        >
          <Icon className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.2]" />
        </div>
        {badge !== undefined && badge !== null && Number(badge) > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-[11px] font-black text-white bg-rose-600 rounded-full shadow-sm animate-pulse">
            {badge}
          </span>
        )}
      </div>

      {/* Bottom text block: Large Gujarati Title + Subtitle */}
      <div className="w-full mt-1 sm:mt-2">
        <div className="text-xs sm:text-base font-black text-brand-navy leading-tight tracking-tight font-sans truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-[10px] sm:text-xs text-brand-navy/75 font-medium mt-0.5 truncate leading-tight">
            {subtitle}
          </div>
        )}
        {englishTitle && (
          <div className="hidden sm:block text-[10px] text-brand-navy/45 font-semibold uppercase tracking-wider leading-none mt-0.5 truncate">
            {englishTitle}
          </div>
        )}
      </div>
    </button>
  );
};
