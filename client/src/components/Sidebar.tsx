import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import {
  LayoutDashboard,
  PackageCheck,
  PackagePlus,
  UtensilsCrossed,
  Boxes,
  ScrollText,
  ClipboardCheck,
  AlertOctagon,
  FileSpreadsheet,
  History,
  RefreshCw,
  MapPin,
  Truck,
  PlusCircle,
  TrendingDown,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { pendingCount } = useOffline();

  if (!user) return null;

  const role = user.role;

  interface NavItem {
    to: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }

  let items: NavItem[] = [];

  if (role === 'AWW') {
    items = [
      { to: '/', label: t('navDashboard'), icon: LayoutDashboard },
      { to: '/receive-stock', label: t('navReceiveStock'), icon: PackageCheck },
      { to: '/thr-distribution', label: t('navThrDistribution'), icon: PackagePlus },
      { to: '/hcm-service', label: t('navHcmService'), icon: UtensilsCrossed },
      { to: '/stock', label: t('navStockOverview'), icon: Boxes },
      { to: '/ledger', label: t('navStockLedger'), icon: ScrollText },
      { to: '/physical-count', label: t('navPhysicalCount'), icon: ClipboardCheck },
      { to: '/write-off', label: t('navWriteOff'), icon: TrendingDown },
      { to: '/reports', label: t('navReports'), icon: FileSpreadsheet },
      { to: '/sync-centre', label: t('navSyncCenter'), icon: RefreshCw, badge: pendingCount > 0 ? pendingCount : undefined },
    ];
  } else if (role === 'AWH') {
    items = [
      { to: '/', label: t('navDashboard'), icon: LayoutDashboard },
      { to: '/stock', label: t('navStockOverview'), icon: Boxes },
      { to: '/dispatches', label: t('navDispatches'), icon: Truck },
    ];
  } else if (role === 'SUPERVISOR') {
    items = [
      { to: '/', label: t('navDashboard'), icon: LayoutDashboard },
      { to: '/heatmap', label: t('navHeatmap'), icon: MapPin },
      { to: '/discrepancies', label: t('navDiscrepancies'), icon: AlertOctagon },
      { to: '/write-off', label: t('navWriteOff'), icon: TrendingDown },
      { to: '/stock', label: t('navStockOverview'), icon: Boxes },
      { to: '/dispatches', label: t('navDispatches'), icon: Truck },
      { to: '/reports', label: t('navReports'), icon: FileSpreadsheet },
      { to: '/audit', label: t('navAuditLog'), icon: History },
    ];
  } else if (role === 'CDPO' || role === 'DPO') {
    items = [
      { to: '/', label: t('navDashboard'), icon: LayoutDashboard },
      { to: '/heatmap', label: t('navHeatmap'), icon: MapPin },
      { to: '/discrepancies', label: t('navDiscrepancies'), icon: AlertOctagon },
      { to: '/write-off', label: t('navWriteOff'), icon: TrendingDown },
      { to: '/dispatches', label: t('navDispatches'), icon: Truck },
      { to: '/reports', label: t('navReports'), icon: FileSpreadsheet },
      { to: '/audit', label: t('navAuditLog'), icon: History },
    ];
  } else if (role === 'SUPPLIER') {
    items = [
      { to: '/', label: t('navDashboard'), icon: LayoutDashboard },
      { to: '/dispatches', label: t('navDispatches'), icon: Truck },
      { to: '/create-dispatch', label: 'Create Dispatch', icon: PlusCircle },
    ];
  }

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 shadow-sm flex-shrink-0">
        <div className="mb-3 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Navigation
        </div>
        <nav className="flex-1 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-forest-50 text-forest-800 font-bold border border-forest-200/60 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-saffron-500 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation Bar for Frontline Workers */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 shadow-lg flex items-center justify-around">
        {items.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-bold transition ${
                  isActive ? 'text-forest-700' : 'text-slate-400 hover:text-slate-700'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-saffron-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[64px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </>
  );
};
