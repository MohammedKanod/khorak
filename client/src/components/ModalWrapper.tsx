import React, { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  englishTitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
  stepIndicator?: string; // e.g. "પગલું 1/3"
  onBack?: () => void;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  englishTitle,
  icon: Icon,
  iconColor = 'text-brand-orange',
  bgColor = 'bg-amber-100',
  borderColor = 'border-[#C8B89E]',
  stepIndicator,
  onBack,
  children,
  footerActions,
  maxWidth = '2xl',
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-brand-navy/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container: Viewport-constrained with docked header & footer and clear distributive border */}
      <div
        className={`relative w-full ${maxWidthClass} max-h-[95dvh] sm:max-h-[88vh] bg-[#FAF3E8] rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-[2.5px] ${borderColor} flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150`}
      >
        {/* Docked Modal Header with Theme Pastel Tint */}
        <div
          className={`w-full ${bgColor}/85 backdrop-blur-md px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b-2 border-[#E0D5C3] flex items-center justify-between flex-shrink-0 shadow-xs`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-xl hover:bg-white/70 text-brand-navy transition active:scale-95"
                title="પાછા જાઓ (Back)"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : Icon ? (
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center bg-white/90 ${iconColor} flex-shrink-0 shadow-xs border-2 border-white`}
              >
                <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
              </div>
            ) : null}

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-black text-brand-navy leading-tight truncate font-sans">
                  {title}
                </h2>
                {stepIndicator && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-orange/15 text-brand-orange border border-brand-orange/30">
                    {stepIndicator}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-[11px] sm:text-xs text-brand-navy/70 truncate mt-0.5 font-medium">
                  {subtitle}
                </p>
              )}
              {englishTitle && (
                <span className="text-[10px] text-brand-navy/40 uppercase font-bold tracking-wider">
                  {englishTitle}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-brand-navy/60 hover:text-brand-navy hover:bg-slate-100 transition active:scale-95 flex-shrink-0"
            title="બંધ કરો (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body (Bounded within dialog, zero page scrolling) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
          {children}
        </div>

        {/* Docked Modal Footer Actions */}
        {footerActions && (
          <div className="w-full bg-white/95 px-4 sm:px-6 py-3 border-t-2 border-[#E0D5C3] flex items-center justify-between gap-3 flex-shrink-0">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
};
