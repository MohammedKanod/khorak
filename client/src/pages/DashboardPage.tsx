import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { SquareTile } from '../components/SquareTile';
import { DeliveryPreviewCard } from '../components/DeliveryPreviewCard';

// Popup Modals
import { ReceiveStockModal } from '../components/modals/ReceiveStockModal';
import { ThrDistributionModal } from '../components/modals/ThrDistributionModal';
import { HcmServiceModal } from '../components/modals/HcmServiceModal';
import { StockOverviewModal } from '../components/modals/StockOverviewModal';
import { StockLedgerModal } from '../components/modals/StockLedgerModal';
import { PhysicalCountModal } from '../components/modals/PhysicalCountModal';
import { WriteOffModal } from '../components/modals/WriteOffModal';
import { ReportsModal } from '../components/modals/ReportsModal';
import { SyncCentreModal } from '../components/modals/SyncCentreModal';
import { AlertsModal } from '../components/modals/AlertsModal';
import { SettingsModal } from '../components/modals/SettingsModal';

import {
  PackageCheck,
  PackagePlus,
  UtensilsCrossed,
  Layers,
  BookOpen,
  Scale,
  TrendingDown,
  FileText,
  RefreshCw,
  Truck,
  PlusCircle,
  FileSpreadsheet,
  AlertTriangle,
  ClipboardList,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export type ModalType =
  | 'RECEIVE_STOCK'
  | 'THR_DISTRIBUTION'
  | 'HCM_SERVICE'
  | 'STOCK_OVERVIEW'
  | 'STOCK_LEDGER'
  | 'PHYSICAL_COUNT'
  | 'WRITE_OFF'
  | 'REPORTS'
  | 'SYNC_CENTRE'
  | 'ALERTS'
  | 'SETTINGS'
  | null;

interface DashboardPageProps {
  initialModal?: ModalType;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ initialModal }) => {
  const { user, apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const { pendingCount } = useOffline();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState<ModalType>(initialModal || null);
  const [incomingDispatches, setIncomingDispatches] = useState<any[]>([]);
  const [openDiscrepancies, setOpenDiscrepancies] = useState<any[]>([]);
  const [selectedDispatchForReceipt, setSelectedDispatchForReceipt] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync modal state from URL search params or prop
  useEffect(() => {
    const modalParam = searchParams.get('modal');
    if (modalParam) {
      const mapping: Record<string, ModalType> = {
        'receive-stock': 'RECEIVE_STOCK',
        'thr-distribution': 'THR_DISTRIBUTION',
        'hcm-service': 'HCM_SERVICE',
        stock: 'STOCK_OVERVIEW',
        ledger: 'STOCK_LEDGER',
        'physical-count': 'PHYSICAL_COUNT',
        'write-off': 'WRITE_OFF',
        reports: 'REPORTS',
        sync: 'SYNC_CENTRE',
        alerts: 'ALERTS',
        settings: 'SETTINGS',
      };
      if (mapping[modalParam]) {
        setActiveModal(mapping[modalParam]);
      }
    } else if (initialModal) {
      setActiveModal(initialModal);
    }
  }, [searchParams, initialModal]);

  const openModal = (type: ModalType, paramName?: string) => {
    setActiveModal(type);
    if (paramName) {
      setSearchParams({ modal: paramName });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedDispatchForReceipt(null);
    setSearchParams({});
  };

  // Load dashboard data
  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      if (user.role === 'AWW' || user.role === 'AWH') {
        const [dispRes, discRes] = await Promise.all([
          apiFetch('/api/dispatches').catch(() => ({ dispatches: [] })),
          apiFetch('/api/discrepancies?status=OPEN').catch(() => ({ discrepancies: [] })),
        ]);
        setIncomingDispatches(
          (dispRes.dispatches || []).filter(
            (d: any) => d.status === 'DISPATCHED' || d.status === 'PARTIALLY_RECEIVED'
          )
        );
        setOpenDiscrepancies(discRes.discrepancies || []);
      } else if (user.role === 'SUPERVISOR' || user.role === 'CDPO' || user.role === 'DPO') {
        const [dispRes, discRes] = await Promise.all([
          apiFetch('/api/dispatches').catch(() => ({ dispatches: [] })),
          apiFetch('/api/discrepancies?status=OPEN').catch(() => ({ discrepancies: [] })),
        ]);
        setIncomingDispatches(dispRes.dispatches || []);
        setOpenDiscrepancies(discRes.discrepancies || []);
      } else if (user.role === 'SUPPLIER') {
        const dispRes = await apiFetch('/api/dispatches').catch(() => ({ dispatches: [] }));
        setIncomingDispatches(dispRes.dispatches || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-y-auto select-none">
      {/* FRONTLINE AWW / AWH VIEW (Exact match to Reference Image) */}
      {(user.role === 'AWW' || user.role === 'AWH') && (
        <div className="w-full min-h-full flex flex-col justify-between gap-2 sm:gap-3 overflow-y-auto pb-1">
          {/* THE 9 SQUARE ACTION TILES (3x3 Grid) with Exact Reference Image Pastel Colors & Borders */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1 min-h-0 items-stretch">
            {/* 1. સ્ટોક મેળવો - Pastel Pink */}
            <SquareTile
              id="tile-receive-stock"
              title={language === 'gu' ? 'સ્ટોક મેળવો' : 'Receive Stock'}
              subtitle={language === 'gu' ? 'આવેલ જથ્થો દાખલ કરો' : 'Enter received qty'}
              englishTitle={language === 'gu' ? 'RECEIVE STOCK' : undefined}
              icon={PackageCheck}
              iconColor="text-pastel-pinkIcon"
              bgColor="bg-pastel-pink hover:bg-pastel-pinkHover"
              borderColor="border-[#F8B4BA]"
              badge={incomingDispatches.length > 0 ? incomingDispatches.length : null}
              onClick={() => navigate('/receive-stock')}
            />

            {/* 2. THR વિતરણ - Pastel Peach */}
            <SquareTile
              id="tile-thr-distribution"
              title={language === 'gu' ? 'THR વિતરણ' : 'THR Distribution'}
              subtitle={language === 'gu' ? 'પૌષ્ટિક આહાર આપો' : 'Provide ration pack'}
              englishTitle={language === 'gu' ? 'THR DISTRIBUTION' : undefined}
              icon={PackagePlus}
              iconColor="text-pastel-peachIcon"
              bgColor="bg-pastel-peach hover:bg-pastel-peachHover"
              borderColor="border-[#FDC58A]"
              onClick={() => navigate('/thr-distribution')}
            />

            {/* 3. ગરમ ભોજન - Pastel Cyan */}
            <SquareTile
              id="tile-hcm-service"
              title={language === 'gu' ? 'ગરમ ભોજન' : 'Hot Cooked Meals'}
              subtitle={language === 'gu' ? 'નોંધ કરો' : 'Log daily service'}
              englishTitle={language === 'gu' ? 'HOT COOKED MEALS' : undefined}
              icon={UtensilsCrossed}
              iconColor="text-pastel-cyanIcon"
              bgColor="bg-pastel-cyan hover:bg-pastel-cyanHover"
              borderColor="border-[#98EDE4]"
              onClick={() => navigate('/hcm-service')}
            />

            {/* 4. વર્તમાન સ્ટોક - Pastel Blue */}
            <SquareTile
              id="tile-stock-balance"
              title={language === 'gu' ? 'વર્તમાન સ્ટોક' : 'Stock Balance'}
              subtitle={language === 'gu' ? 'હાલનો જથ્થો જુઓ' : 'View live balance'}
              englishTitle={language === 'gu' ? 'STOCK BALANCE' : undefined}
              icon={Layers}
              iconColor="text-pastel-blueIcon"
              bgColor="bg-pastel-blue hover:bg-pastel-blueHover"
              borderColor="border-[#ADC4FA]"
              onClick={() => navigate('/stock')}
            />

            {/* 5. સ્ટોક નોંધપોથી - Pastel Yellow */}
            <SquareTile
              id="tile-stock-ledger"
              title={language === 'gu' ? 'સ્ટોક નોંધપોથી' : 'Stock Ledger'}
              subtitle={language === 'gu' ? 'બધી એન્ટ્રી જુઓ' : 'View all entries'}
              englishTitle={language === 'gu' ? 'STOCK LEDGER' : undefined}
              icon={BookOpen}
              iconColor="text-pastel-yellowIcon"
              bgColor="bg-pastel-yellow hover:bg-pastel-yellowHover"
              borderColor="border-[#FDEE72]"
              onClick={() => navigate('/ledger')}
            />

            {/* 6. ભૌતિક ગણતરી - Pastel Lime */}
            <SquareTile
              id="tile-physical-count"
              title={language === 'gu' ? 'ભૌતિક ગણતરી' : 'Physical Count'}
              subtitle={language === 'gu' ? 'સ્ટોક ચકાસો' : 'Verify physical count'}
              englishTitle={language === 'gu' ? 'PHYSICAL COUNT' : undefined}
              icon={Scale}
              iconColor="text-pastel-limeIcon"
              bgColor="bg-pastel-lime hover:bg-pastel-limeHover"
              borderColor="border-[#B0F090]"
              onClick={() => navigate('/physical-count')}
            />

            {/* 7. બગાડ / નુકસાન - Pastel Purple */}
            <SquareTile
              id="tile-write-off"
              title={language === 'gu' ? 'બગાડ / નુકસાન' : 'Damage / Spoilage'}
              subtitle={language === 'gu' ? 'રિપોર્ટ કરો' : 'Report spoilage'}
              englishTitle={language === 'gu' ? 'DAMAGE / SPOILAGE' : undefined}
              icon={TrendingDown}
              iconColor="text-pastel-purpleIcon"
              bgColor="bg-pastel-purple hover:bg-pastel-purpleHover"
              borderColor="border-[#F4A9EE]"
              onClick={() => navigate('/write-off')}
            />

            {/* 8. રિપોર્ટ અને MPR - Pastel Mint */}
            <SquareTile
              id="tile-reports-mpr"
              title={language === 'gu' ? 'રિપોર્ટ અને MPR' : 'Reports & MPR'}
              subtitle={language === 'gu' ? 'અહેવાલ જુઓ' : 'View monthly progress'}
              englishTitle={language === 'gu' ? 'REPORTS & MPR' : undefined}
              icon={FileText}
              iconColor="text-pastel-mintIcon"
              bgColor="bg-pastel-mint hover:bg-pastel-mintHover"
              borderColor="border-[#8CEFDA]"
              onClick={() => navigate('/reports')}
            />

            {/* 9. સિંક કેન્દ્ર - Pastel Violet */}
            <SquareTile
              id="tile-sync-centre"
              title={language === 'gu' ? 'સિંક કેન્દ્ર' : 'Sync Centre'}
              subtitle={language === 'gu' ? 'ડેટા મોકલો' : 'Synchronize data'}
              englishTitle={language === 'gu' ? 'SYNC CENTRE' : undefined}
              icon={RefreshCw}
              iconColor="text-pastel-violetIcon"
              bgColor="bg-pastel-violet hover:bg-pastel-violetHover"
              borderColor="border-[#C1B4FA]"
              badge={pendingCount > 0 ? pendingCount : null}
              onClick={() => navigate('/sync-centre')}
            />
          </div>

          {/* INCOMING DELIVERIES CARD ("આજની ડિલિવરી") - Navigates directly to dedicated /receive-stock page */}
          <div className="flex-shrink-0">
            <DeliveryPreviewCard
              dispatches={incomingDispatches}
              onReceive={() => navigate('/receive-stock')}
              onViewAll={() => navigate('/receive-stock')}
            />
          </div>
        </div>
      )}

      {/* SUPERVISOR / CDPO / DPO VIEW (Tailored 3x3 Grid with Identical Visual Language) */}
      {(user.role === 'SUPERVISOR' || user.role === 'CDPO' || user.role === 'DPO') && (
        <div className="w-full min-h-full flex flex-col justify-between gap-2 sm:gap-3 overflow-y-auto pb-1">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1 min-h-0 items-stretch">
            {/* 1. સેક્ટર હીટમેપ - Mint */}
            <SquareTile
              title={language === 'gu' ? 'સેક્ટર હીટમેપ' : 'Sector Heatmap'}
              subtitle={language === 'gu' ? 'કેન્દ્રોની સ્ટોક સ્થિતિ' : 'Stock status across AWCs'}
              icon={Building2}
              iconColor="text-pastel-mintIcon"
              bgColor="bg-pastel-mint hover:bg-pastel-mintHover"
              borderColor="border-[#8CEFDA]"
              onClick={() => navigate('/heatmap')}
            />

            {/* 2. વિસંગતતાઓ - Pink / Rose */}
            <SquareTile
              title={language === 'gu' ? 'વિસંગતતાઓ' : 'Discrepancies'}
              subtitle={language === 'gu' ? 'ઓછો અથવા બગડેલ જથ્થો' : 'Review delivery shortages'}
              icon={AlertTriangle}
              iconColor="text-rose-700"
              bgColor="bg-rose-100 hover:bg-rose-200"
              borderColor="border-rose-300"
              badge={openDiscrepancies.length > 0 ? openDiscrepancies.length : null}
              onClick={() => navigate('/discrepancies')}
            />

            {/* 3. બગાડ મંજૂરી - Purple */}
            <SquareTile
              title={language === 'gu' ? 'બગાડ મંજૂરી' : 'Write-Off Approvals'}
              subtitle={language === 'gu' ? 'માંડી વાળવાની દરખાસ્તો' : 'Review pending write-offs'}
              icon={TrendingDown}
              iconColor="text-pastel-purpleIcon"
              bgColor="bg-pastel-purple hover:bg-pastel-purpleHover"
              borderColor="border-[#F4A9EE]"
              onClick={() => navigate('/write-off')}
            />

            {/* 4. સ્ટોક સમીક્ષા - Blue */}
            <SquareTile
              title={language === 'gu' ? 'સ્ટોક વિહંગાવલોકન' : 'Stock Overview'}
              subtitle={language === 'gu' ? 'કેન્દ્રવાર જથ્થો' : 'Inspect centre balances'}
              icon={Layers}
              iconColor="text-pastel-blueIcon"
              bgColor="bg-pastel-blue hover:bg-pastel-blueHover"
              borderColor="border-[#ADC4FA]"
              onClick={() => navigate('/stock')}
            />

            {/* 5. ડિસ્પેચ ટ્રેકિંગ - Peach */}
            <SquareTile
              title={language === 'gu' ? 'ડિસ્પેચ ટ્રેકિંગ' : 'Deliveries'}
              subtitle={language === 'gu' ? 'સપ્લાયર ચલણ સ્થિતિ' : 'Track supply chain flow'}
              icon={Truck}
              iconColor="text-pastel-peachIcon"
              bgColor="bg-pastel-peach hover:bg-pastel-peachHover"
              borderColor="border-[#FDC58A]"
              onClick={() => navigate('/dispatches')}
            />

            {/* 6. ભૌતિક વેરિફિકેશન - Lime */}
            <SquareTile
              title={language === 'gu' ? 'ભૌતિક ઓડિટ' : 'Physical Audits'}
              subtitle={language === 'gu' ? 'ચકાસણી નોંધણી' : 'Inspect variances'}
              icon={Scale}
              iconColor="text-pastel-limeIcon"
              bgColor="bg-pastel-lime hover:bg-pastel-limeHover"
              borderColor="border-[#B0F090]"
              onClick={() => navigate('/physical-count')}
            />

            {/* 7. ઓડિટ ટ્રેલ - Yellow */}
            <SquareTile
              title={language === 'gu' ? 'ઓડિટ લોગ' : 'Audit Trail'}
              subtitle={language === 'gu' ? 'સુરક્ષિત લોગ' : 'Tamper-evident logs'}
              icon={ShieldCheck}
              iconColor="text-pastel-yellowIcon"
              bgColor="bg-pastel-yellow hover:bg-pastel-yellowHover"
              borderColor="border-[#FDEE72]"
              onClick={() => navigate('/audit')}
            />

            {/* 8. અહેવાલ અને MPR - Mint */}
            <SquareTile
              title={language === 'gu' ? 'રિપોર્ટ અને MPR' : 'Reports & MPR'}
              subtitle={language === 'gu' ? 'તાલુકા/જિલ્લા સારાંશ' : 'Block & district reports'}
              icon={FileText}
              iconColor="text-pastel-mintIcon"
              bgColor="bg-pastel-mint hover:bg-pastel-mintHover"
              borderColor="border-[#8CEFDA]"
              onClick={() => navigate('/reports')}
            />

            {/* 9. સમન્વય સ્થિતિ - Violet */}
            <SquareTile
              title={language === 'gu' ? 'સિંક સ્થિતિ' : 'Sync Centre'}
              subtitle={language === 'gu' ? 'સર્વર જોડાણ' : 'Server synchronization'}
              icon={RefreshCw}
              iconColor="text-pastel-violetIcon"
              bgColor="bg-pastel-violet hover:bg-pastel-violetHover"
              borderColor="border-[#C1B4FA]"
              onClick={() => navigate('/sync-centre')}
            />
          </div>
        </div>
      )}

      {/* SUPPLIER VIEW (Dispatches & Proof of Deliveries) */}
      {user.role === 'SUPPLIER' && (
        <div className="w-full min-h-full flex flex-col justify-between gap-2 sm:gap-3 overflow-y-auto pb-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 flex-1 min-h-0 items-stretch">
            {/* 1. નવો ડિસ્પેચ */}
            <SquareTile
              title={language === 'gu' ? 'નવો ડિસ્પેચ બનાવો' : 'Create Dispatch'}
              subtitle={language === 'gu' ? 'ચલણ અને જથ્થો રવાના કરો' : 'Generate new challan'}
              icon={PlusCircle}
              iconColor="text-pastel-pinkIcon"
              bgColor="bg-pastel-pink hover:bg-pastel-pinkHover"
              borderColor="border-[#F8B4BA]"
              onClick={() => navigate('/create-dispatch')}
            />

            {/* 2. સક્રિય ડિસ્પેચ યાદી */}
            <SquareTile
              title={language === 'gu' ? 'ડિસ્પેચ યાદી' : 'Active Dispatches'}
              subtitle={language === 'gu' ? 'તમામ રવાના કરેલ માલ' : 'Track ongoing dispatches'}
              icon={Truck}
              iconColor="text-pastel-peachIcon"
              bgColor="bg-pastel-peach hover:bg-pastel-peachHover"
              borderColor="border-[#FDC58A]"
              onClick={() => navigate('/dispatches')}
            />

            {/* 3. ડિલિવરી રસીદો */}
            <SquareTile
              title={language === 'gu' ? 'ડિલિવરી રસીદો' : 'Delivery Receipts'}
              subtitle={language === 'gu' ? 'આંગણવાડી સ્વીકૃતિ પાવતી' : 'Receipt confirmations'}
              icon={PackageCheck}
              iconColor="text-pastel-cyanIcon"
              bgColor="bg-pastel-cyan hover:bg-pastel-cyanHover"
              borderColor="border-[#98EDE4]"
              onClick={() => navigate('/dispatches')}
            />

            {/* 4. નોંધાયેલ વિસંગતતાઓ */}
            <SquareTile
              title={language === 'gu' ? 'વિસંગતતાઓ' : 'Shortage Claims'}
              subtitle={language === 'gu' ? 'ઓછા જથ્થાના દાવા' : 'Reported delivery shortages'}
              icon={AlertTriangle}
              iconColor="text-rose-700"
              bgColor="bg-rose-100 hover:bg-rose-200"
              borderColor="border-rose-300"
              onClick={() => navigate('/discrepancies')}
            />

            {/* 5. સપ્લાય રિપોર્ટ */}
            <SquareTile
              title={language === 'gu' ? 'સપ્લાય રિપોર્ટ' : 'Supply Reports'}
              subtitle={language === 'gu' ? 'માસિક સારાંશ' : 'Monthly delivery statistics'}
              icon={FileText}
              iconColor="text-pastel-mintIcon"
              bgColor="bg-pastel-mint hover:bg-pastel-mintHover"
              borderColor="border-[#8CEFDA]"
              onClick={() => navigate('/reports')}
            />

            {/* 6. સેટિંગ્સ */}
            <SquareTile
              title={language === 'gu' ? 'પ્રોફાઇલ / સેટિંગ્સ' : 'Profile & Settings'}
              subtitle={language === 'gu' ? 'સપ્લાયર વિગતો' : 'Account & language'}
              icon={RefreshCw}
              iconColor="text-pastel-violetIcon"
              bgColor="bg-pastel-violet hover:bg-pastel-violetHover"
              borderColor="border-[#C1B4FA]"
              onClick={() => navigate('/settings')}
            />
          </div>
        </div>
      )}

      {/* POPUP WORKFLOW MODALS (Zero Page Scrolling) */}
      <ReceiveStockModal
        isOpen={activeModal === 'RECEIVE_STOCK'}
        onClose={closeModal}
        preselectedDispatch={selectedDispatchForReceipt}
        onSuccess={loadData}
      />

      <ThrDistributionModal
        isOpen={activeModal === 'THR_DISTRIBUTION'}
        onClose={closeModal}
        onSuccess={loadData}
      />

      <HcmServiceModal
        isOpen={activeModal === 'HCM_SERVICE'}
        onClose={closeModal}
        onSuccess={loadData}
      />

      <StockOverviewModal
        isOpen={activeModal === 'STOCK_OVERVIEW'}
        onClose={closeModal}
        onOpenLedger={() => openModal('STOCK_LEDGER', 'ledger')}
      />

      <StockLedgerModal
        isOpen={activeModal === 'STOCK_LEDGER'}
        onClose={closeModal}
      />

      <PhysicalCountModal
        isOpen={activeModal === 'PHYSICAL_COUNT'}
        onClose={closeModal}
        onSuccess={loadData}
      />

      <WriteOffModal
        isOpen={activeModal === 'WRITE_OFF'}
        onClose={closeModal}
        onSuccess={loadData}
      />

      <ReportsModal
        isOpen={activeModal === 'REPORTS'}
        onClose={closeModal}
      />

      <SyncCentreModal
        isOpen={activeModal === 'SYNC_CENTRE'}
        onClose={closeModal}
      />

      <AlertsModal
        isOpen={activeModal === 'ALERTS'}
        onClose={closeModal}
        onOpenReceipt={() => openModal('RECEIVE_STOCK', 'receive-stock')}
      />

      <SettingsModal
        isOpen={activeModal === 'SETTINGS'}
        onClose={closeModal}
      />
    </div>
  );
};
