import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { Wifi, WifiOff, RefreshCw, Languages, LogOut, ShieldCheck, MapPin } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { isOnline, isSyncing, pendingCount, syncNow } = useOffline();

  return (
    <header className="sticky top-0 z-40 bg-forest-800 text-white shadow-md border-b border-forest-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-forest-700 border border-forest-600/60 flex items-center justify-center text-saffron-400 font-extrabold text-xl shadow-inner">
              ખ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans">
                  {t('appName')}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-forest-700/80 text-saffron-300 border border-forest-600/50 hidden sm:inline-block">
                  ICDS Gujarat
                </span>
              </div>
              <p className="text-[11px] text-forest-200 truncate hidden md:block max-w-sm">
                {t('appTagline')}
              </p>
            </div>
          </div>

          {/* Center Info: Assigned AWC / Sector (for frontline & supervisors) */}
          {user && (
            <div className="hidden lg:flex items-center space-x-2 text-xs bg-forest-900/60 py-1.5 px-3 rounded-lg border border-forest-700/40 text-forest-100">
              <MapPin className="w-3.5 h-3.5 text-saffron-400" />
              <span>
                {user.awc
                  ? language === 'gu' ? user.awc.nameGu : user.awc.nameEn
                  : user.sector
                  ? language === 'gu' ? user.sector.nameGu : user.sector.nameEn
                  : user.block
                  ? language === 'gu' ? user.block.nameGu : user.block.nameEn
                  : 'Panchmahal District'}
              </span>
              {user.awc && <span className="opacity-60 text-[10px]">({user.awc.code})</span>}
            </div>
          )}

          {/* Right Action Controls: Sync Status, Language Toggle, User Profile, Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Sync / Offline Pill */}
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                !isOnline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : pendingCount > 0
                  ? 'bg-saffron-500/20 text-saffron-300 border-saffron-500/40 animate-pulse'
                  : 'bg-forest-700/50 text-forest-200 border-forest-600/40'
              }`}
              title={!isOnline ? 'Offline mode active' : `${pendingCount} pending records`}
            >
              {!isOnline ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              ) : isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-saffron-400" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">
                {!isOnline ? 'Offline' : isSyncing ? 'Syncing...' : pendingCount > 0 ? `${pendingCount} Pending` : 'Online'}
              </span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-forest-700 hover:bg-forest-600 border border-forest-600/60 text-xs font-bold text-white transition active:scale-95"
              aria-label="Toggle language"
            >
              <Languages className="w-3.5 h-3.5 text-saffron-300" />
              <span>{language === 'gu' ? 'English' : 'ગુજરાતી'}</span>
            </button>

            {/* User Profile Info */}
            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-forest-700/60">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight">
                    {language === 'gu' ? user.fullNameGu : user.fullNameEn}
                  </div>
                  <div className="text-[10px] font-semibold text-saffron-300 leading-tight">
                    {t(`role_${user.role}` as any)}
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-forest-200 hover:text-white hover:bg-forest-700 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
