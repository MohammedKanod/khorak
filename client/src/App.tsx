import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { OfflineProvider, useOffline } from './context/OfflineContext';
import { AppHeader } from './components/AppHeader';
import { BottomNav, NavTab } from './components/BottomNav';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeliveryReceiptPage } from './pages/DeliveryReceiptPage';
import { ThrDistributionPage } from './pages/ThrDistributionPage';
import { HcmServicePage } from './pages/HcmServicePage';
import { StockOverviewPage } from './pages/StockOverviewPage';
import { StockLedgerPage } from './pages/StockLedgerPage';
import { PhysicalCountPage } from './pages/PhysicalCountPage';
import { WriteOffPage } from './pages/WriteOffPage';
import { ReportsPage } from './pages/ReportsPage';
import { SyncCentrePage } from './pages/SyncCentrePage';
import { SettingsPage } from './pages/SettingsPage';
import { SectorHeatmapPage } from './pages/SectorHeatmapPage';
import { DiscrepanciesPage } from './pages/DiscrepanciesPage';
import { DispatchesPage } from './pages/DispatchesPage';
import { CreateDispatchPage } from './pages/CreateDispatchPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { ArrowLeft } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const SecondaryPageShell: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const navigate = useNavigate();
  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-cream-100">
      <div className="flex items-center space-x-2 py-2 px-1 border-b border-[#EADDCC] flex-shrink-0">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-1.5 rounded-xl hover:bg-slate-200 text-brand-navy transition active:scale-95 flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold">પાછા જાઓ (Home)</span>
        </button>
        <span className="text-xs font-black text-brand-navy truncate">
          · {title}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-2 pr-1">{children}</div>
    </div>
  );
};

const ProtectedLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { pendingCount } = useOffline();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#FAF3E8] flex items-center justify-center text-xs font-black text-brand-navy font-sans">
        ખોરાક (KHORAK) સિસ્ટમ શરૂ થઈ રહી છે...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Determine active bottom nav tab
  let activeTab: NavTab = 'home';
  if (location.pathname === '/discrepancies') {
    activeTab = 'alerts';
  } else if (location.pathname === '/reports') {
    activeTab = 'reports';
  } else if (location.pathname === '/settings') {
    activeTab = 'settings';
  }

  const handleTabChange = (tab: NavTab) => {
    if (tab === 'home') {
      navigate('/');
    } else if (tab === 'alerts') {
      navigate('/discrepancies');
    } else if (tab === 'reports') {
      navigate('/reports');
    } else if (tab === 'settings') {
      navigate('/settings');
    }
  };

  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full bg-cream-100 flex flex-col justify-between font-sans overflow-hidden">
      {/* Top Application Header (Matching Reference Image) */}
      <AppHeader
        onOpenSync={() => navigate('/sync-centre')}
        onOpenSettings={() => navigate('/settings')}
      />

      {/* Main Viewport Content Area: Scrollable when content exceeds viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2.5 overflow-y-auto flex flex-col min-h-0">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/receive-stock" element={<DeliveryReceiptPage />} />
          <Route path="/thr-distribution" element={<ThrDistributionPage />} />
          <Route path="/hcm-service" element={<HcmServicePage />} />
          <Route path="/stock" element={<StockOverviewPage />} />
          <Route path="/ledger" element={<StockLedgerPage />} />
          <Route path="/physical-count" element={<PhysicalCountPage />} />
          <Route path="/write-off" element={<WriteOffPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/sync-centre" element={<SyncCentrePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Supervisor & Management Secondary Views */}
          <Route
            path="/heatmap"
            element={
              <SecondaryPageShell title="સેક્ટર હીટમેપ (Sector Heatmap)">
                <SectorHeatmapPage />
              </SecondaryPageShell>
            }
          />
          <Route
            path="/discrepancies"
            element={
              <SecondaryPageShell title="વિસંગતતાઓ (Discrepancies)">
                <DiscrepanciesPage />
              </SecondaryPageShell>
            }
          />
          <Route
            path="/dispatches"
            element={
              <SecondaryPageShell title="ડિસ્પેચ યાદી (Dispatches)">
                <DispatchesPage />
              </SecondaryPageShell>
            }
          />
          <Route
            path="/create-dispatch"
            element={
              <SecondaryPageShell title="નવો ડિસ્પેચ બનાવો (Create Dispatch)">
                <CreateDispatchPage />
              </SecondaryPageShell>
            }
          />
          <Route
            path="/audit"
            element={
              <SecondaryPageShell title="ઓડિટ ટ્રેલ (Audit Log)">
                <AuditLogPage />
              </SecondaryPageShell>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom Navigation Bar (Matching Reference Image) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <OfflineProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/*" element={<ProtectedLayout />} />
              </Routes>
            </BrowserRouter>
          </OfflineProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
