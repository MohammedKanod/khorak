import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Home, Bell, FileText, Settings } from 'lucide-react';

export type NavTab = 'home' | 'alerts' | 'reports' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  alertCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  alertCount = 0,
}) => {
  const { language } = useLanguage();

  const tabs = [
    {
      id: 'home' as NavTab,
      labelGu: 'ઘર',
      labelEn: 'Home',
      icon: Home,
    },
    {
      id: 'alerts' as NavTab,
      labelGu: 'ચેતવણીઓ',
      labelEn: 'Alerts',
      icon: Bell,
      badge: alertCount > 0 ? alertCount : null,
    },
    {
      id: 'reports' as NavTab,
      labelGu: 'રિપોર્ટ',
      labelEn: 'Reports',
      icon: FileText,
    },
    {
      id: 'settings' as NavTab,
      labelGu: 'સેટિંગ્સ',
      labelEn: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="w-full bg-[#FAF3E8]/95 backdrop-blur-md border-t border-[#EADDCC] py-1 sm:py-1.5 px-4 flex-shrink-0 z-30 select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const label = language === 'gu' ? tab.labelGu : tab.labelEn;

          const getActivePillStyle = (id: NavTab) => {
            switch (id) {
              case 'home':
                return 'bg-pastel-peach text-brand-orange shadow-xs font-black border border-[#FED9AE]';
              case 'alerts':
                return 'bg-pastel-pink text-rose-700 shadow-xs font-black border border-[#FCD6DB]';
              case 'reports':
                return 'bg-pastel-mint text-teal-800 shadow-xs font-black border border-[#A8F6E6]';
              case 'settings':
                return 'bg-pastel-violet text-indigo-800 shadow-xs font-black border border-[#DDD5FC]';
            }
          };

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 sm:py-1.5 px-2 rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer ${
                isActive
                  ? getActivePillStyle(tab.id)
                  : 'text-brand-navy/60 hover:text-brand-navy hover:bg-white/40 font-semibold'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-150 ${
                    isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight mt-0.5">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
