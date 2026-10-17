import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import {
  MapPin,
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
  LogOut,
  Wheat,
  ChevronDown,
} from 'lucide-react';

interface AppHeaderProps {
  onOpenSync?: () => void;
  onOpenSettings?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSync, onOpenSettings }) => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { isOnline, isSyncing, pendingCount, syncNow } = useOffline();

  const awcName = user?.awc
    ? language === 'gu'
      ? user.awc.nameGu
      : user.awc.nameEn
    : user?.sector
    ? language === 'gu'
      ? user.sector.nameGu
      : user.sector.nameEn
    : user?.block
    ? language === 'gu'
      ? user.block.nameGu
      : user.block.nameEn
    : language === 'gu'
    ? 'વાવડી બુજર્ગ આંગણવાડી'
    : 'Vavdi Bujarg AWC';

  const awcCode = user?.awc?.code || '24190101';
  const districtName = language === 'gu' ? 'પંચમહાલ' : 'Panchmahal';

  const userName = user
    ? language === 'gu'
      ? user.fullNameGu
      : user.fullNameEn
    : language === 'gu'
    ? 'હંસાબેન પટેલ'
    : 'Hansaben Patel';

  const roleTitle = user ? t(`role_${user.role}` as any) : 'આંગણવાડી કાર્યકર';

  return (
    <header className="w-full bg-[#FAF3E8]/90 backdrop-blur-sm border-b border-[#EADDCC] px-2.5 sm:px-6 py-2 sm:py-3 select-none flex-shrink-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
        {/* LEFT: Location, Centre Code & Online Status */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center flex-shrink-0">
            <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 max-w-[130px] sm:max-w-xs">
            <h1 className="text-xs sm:text-sm font-black text-brand-navy truncate leading-tight">
              {awcName}
            </h1>
            <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] text-brand-navy/70 mt-0.5">
              <span>{language === 'gu' ? `કોડ: ${awcCode}` : `Code: ${awcCode}`}</span>
              <span>·</span>
              <span>{districtName}</span>
            </div>
            {/* Online / Offline status badge */}
            <button
              type="button"
              onClick={onOpenSync || (() => syncNow())}
              className={`inline-flex items-center space-x-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer active:scale-95 ${
                !isOnline
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : isSyncing
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : pendingCount > 0
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  !isOnline
                    ? 'bg-amber-500'
                    : isSyncing
                    ? 'bg-blue-500 animate-spin'
                    : pendingCount > 0
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500'
                }`}
              />
              <span>
                {!isOnline
                  ? language === 'gu'
                    ? 'ઑફલાઇન'
                    : 'Offline'
                  : isSyncing
                  ? language === 'gu'
                    ? 'સિંક થાય છે...'
                    : 'Syncing...'
                  : pendingCount > 0
                  ? `${pendingCount} ${language === 'gu' ? 'બાકી' : 'Pending'}`
                  : language === 'gu'
                  ? 'ઑનલાઇન'
                  : 'Online'}
              </span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>
          </div>
        </div>

        {/* CENTER: KHORAK Logo & Brand + Mint Pill */}
        <div className="hidden md:flex flex-col items-center justify-center flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-pastel-peach text-pastel-peachIcon border border-white flex items-center justify-center shadow-xs">
              <Wheat className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-left">
              <span className="text-base font-black tracking-tight text-brand-navy">
                {language === 'gu' ? 'ખોરાક' : 'KHORAK'}
              </span>
              <span className="ml-1 text-[11px] font-bold text-brand-orange">
                {language === 'gu' ? 'KHORAK' : 'ખોરાક'}
              </span>
            </div>
          </div>
          <div className="mt-0.5 px-2 py-0.5 rounded-full bg-pastel-mint text-teal-900 border border-[#A8F6E6] text-[9px] font-black uppercase tracking-wider">
            ICDS ગુજરાત
          </div>
        </div>

        {/* RIGHT: Language Toggle, User Profile & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-xl bg-pastel-blue/40 hover:bg-pastel-blue/70 text-brand-navy text-[11px] font-black border border-pastel-blue shadow-xs transition active:scale-95"
            title="Switch Language / ભાષા બદલો"
          >
            <Globe className="w-3.5 h-3.5 text-brand-orange" />
            <span>{language === 'gu' ? 'ENG' : 'ગુજ'}</span>
          </button>

          {/* User Avatar + Details */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center space-x-2 text-left bg-white/60 hover:bg-white p-1 sm:p-1.5 rounded-2xl border border-[#E0D5C3] transition"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-200 text-amber-900 border border-amber-300 flex items-center justify-center font-black text-xs shadow-xs overflow-hidden">
              {userName.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-black text-brand-navy leading-tight truncate max-w-[110px]">
                {userName}
              </div>
              <div className="text-[10px] text-brand-navy/60 font-semibold leading-tight truncate max-w-[110px]">
                {roleTitle}
              </div>
            </div>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-xl text-brand-navy/60 hover:text-rose-700 hover:bg-rose-50 transition active:scale-95"
            title={t('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
