import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { enqueueOfflineOperation } from '../db/offlineDb';
import { SectionHeader } from '../components/SectionHeader';
import { ModalWrapper } from '../components/ModalWrapper';
import { QuantityStepper } from '../components/QuantityStepper';
import { SignaturePad } from '../components/SignaturePad';
import { AadhaarQrScanner } from '../components/AadhaarQrScanner';
import { ContinuousLoopScanner } from '../components/ContinuousLoopScanner';
import { ParsedAadhaarData } from '../utils/aadhaarQrParser';
import confetti from 'canvas-confetti';
import {
  PackagePlus,
  Users,
  CheckCircle2,
  AlertTriangle,
  Search,
  UserPlus,
  QrCode,
  Boxes,
  HeartHandshake,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const ThrDistributionPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const { t, language } = useLanguage();
  const { isOnline } = useOffline();

  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [stockOverview, setStockOverview] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Sub-Popups State
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showContinuousLoop, setShowContinuousLoop] = useState(false);
  const [scannerIntent, setScannerIntent] = useState<'ENROLL' | 'DISTRIBUTE'>('DISTRIBUTE');

  // Distribution Popup State
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [activeBeneficiary, setActiveBeneficiary] = useState<any | null>(null);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [quantity, setQuantity] = useState<number>(4);
  const [signatureData, setSignatureData] = useState<string>('');
  const [distributeSubmitting, setDistributeSubmitting] = useState(false);
  const [distributeError, setDistributeError] = useState('');
  const [distributeSuccess, setDistributeSuccess] = useState(false);

  // Add Beneficiary Popup State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullNameEn, setNewFullNameEn] = useState('');
  const [newFullNameGu, setNewFullNameGu] = useState('');
  const [newCategory, setNewCategory] = useState('CHILD_0_TO_3');
  const [newGuardian, setNewGuardian] = useState('');
  const [newDob, setNewDob] = useState('2025-01-01');
  const [newGender, setNewGender] = useState('FEMALE');
  const [creatingBen, setCreatingBen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [qrNotice, setQrNotice] = useState('');

  const loadData = async () => {
    if (!user?.awcId) return;
    try {
      setLoading(true);
      const [benRes, itemRes, stockRes] = await Promise.all([
        apiFetch(`/api/thr/beneficiaries/${user.awcId}`),
        apiFetch('/api/items'),
        apiFetch(`/api/stock/awc/${user.awcId}`),
      ]);
      setBeneficiaries(benRes.beneficiaries || []);
      const thrItems = (itemRes.items || []).filter((i: any) => i.category === 'THR_PACKET');
      setItems(thrItems);
      setStockOverview(stockRes.stockOverview || []);
    } catch (err) {
      console.error('Failed to load THR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Open Handover Popup for a Beneficiary
  const openHandoverPopup = (ben: any) => {
    setActiveBeneficiary(ben);
    let matchedItem = items[0] || null;
    if (ben.category === 'CHILD_0_TO_3') {
      matchedItem = items.find((i) => i.code === 'THR-BAL-01') || items[0];
    } else if (ben.category === 'PREGNANT_WOMAN' || ben.category === 'LACTATING_MOTHER') {
      matchedItem = items.find((i) => i.code === 'THR-MAT-02') || items[0];
    } else {
      matchedItem = items.find((i) => i.code === 'THR-PUR-03') || items[0];
    }
    setActiveItem(matchedItem);
    setQuantity(ben.category === 'ADOLESCENT_GIRL' ? 2 : 4);
    setSignatureData('');
    setDistributeError('');
    setDistributeSuccess(false);
    setShowDistributeModal(true);
  };

  // Handle Aadhaar QR scan result
  const handleQrScanSuccess = async (data: ParsedAadhaarData) => {
    setShowQrScanner(false);

    if (scannerIntent === 'ENROLL') {
      setNewFullNameEn(data.fullNameEn);
      setNewFullNameGu(data.fullNameGu);
      setNewCategory(data.inferredCategory);
      setNewGuardian(data.guardianName);
      setNewDob(data.dateOfBirth);
      setNewGender(data.gender);
      setQrNotice(`Aadhaar QR verified for ${data.fullNameEn}! Form pre-filled.`);
      setShowAddModal(true);
      return;
    }

    // Otherwise DISTRIBUTE: look for beneficiary in roster
    let target = beneficiaries.find(
      (b) =>
        b.fullNameEn?.toLowerCase().trim() === data.fullNameEn.toLowerCase().trim() ||
        (data.fullNameEn.toLowerCase().includes(b.fullNameEn?.toLowerCase()) && b.fullNameEn?.length > 3)
    );

    if (!target && user?.awcId) {
      try {
        const res = await apiFetch('/api/thr/beneficiaries', {
          method: 'POST',
          body: JSON.stringify({
            awcId: user.awcId,
            fullNameEn: data.fullNameEn,
            fullNameGu: data.fullNameGu,
            category: data.inferredCategory,
            guardianName: data.guardianName || undefined,
            dateOfBirth: new Date(data.dateOfBirth).toISOString(),
            gender: data.gender,
          }),
        });
        if (res.beneficiary) {
          target = res.beneficiary;
          setBeneficiaries((prev) => [res.beneficiary, ...prev]);
        }
      } catch (err) {
        console.warn('Auto-enroll error:', err);
      }
    }

    if (!target) {
      setNewFullNameEn(data.fullNameEn);
      setNewFullNameGu(data.fullNameGu);
      setNewCategory(data.inferredCategory);
      setNewGuardian(data.guardianName);
      setNewDob(data.dateOfBirth);
      setNewGender(data.gender);
      setShowAddModal(true);
      return;
    }

    openHandoverPopup(target);
  };

  // Confirm Handover in Popup
  const handleConfirmDistribution = async () => {
    if (!user?.awcId || !activeBeneficiary || !activeItem) return;

    setDistributeSubmitting(true);
    setDistributeError('');

    const payload = {
      awcId: user.awcId,
      distributionCycle: 'OCT-2026',
      distributions: [
        {
          beneficiaryId: activeBeneficiary.id,
          beneficiaryCategory: activeBeneficiary.category,
          itemId: activeItem.id,
          quantityDistributed: quantity,
          acknowledgmentType: signatureData ? 'SCREEN_SIGNATURE' : 'ROSTER_CONFIRMATION',
          signatureData: signatureData || undefined,
        },
      ],
    };

    try {
      if (isOnline) {
        await apiFetch('/api/thr/distribute', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const stockRes = await apiFetch(`/api/stock/awc/${user.awcId}`);
        setStockOverview(stockRes.stockOverview || []);
      } else {
        await enqueueOfflineOperation('THR_DISTRIBUTE', payload);
      }

      setDistributeSuccess(true);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      setDistributeError(err.message || 'Error recording distribution');
    } finally {
      setDistributeSubmitting(false);
    }
  };

  // Continuous loop scanner distribution record handler
  const handleContinuousDistributionRecorded = async (dist: {
    beneficiary: any;
    item: any;
    quantity: number;
    signatureData?: string;
  }): Promise<boolean> => {
    if (!user?.awcId) return false;

    let benId = dist.beneficiary.id;
    if (typeof benId === 'string' && benId.startsWith('temp-ben-')) {
      try {
        const createRes = await apiFetch('/api/thr/beneficiaries', {
          method: 'POST',
          body: JSON.stringify({
            awcId: user.awcId,
            fullNameEn: dist.beneficiary.fullNameEn,
            fullNameGu: dist.beneficiary.fullNameGu,
            category: dist.beneficiary.category,
            guardianName: dist.beneficiary.guardianName,
            dateOfBirth: new Date('2025-01-01').toISOString(),
            gender: 'FEMALE',
          }),
        });
        if (createRes.beneficiary) {
          benId = createRes.beneficiary.id;
          setBeneficiaries((prev) => [createRes.beneficiary, ...prev]);
        }
      } catch (err) {
        console.warn('Continuous auto-enroll warning:', err);
      }
    }

    const payload = {
      awcId: user.awcId,
      distributionCycle: 'OCT-2026',
      distributions: [
        {
          beneficiaryId: benId,
          beneficiaryCategory: dist.beneficiary.category,
          itemId: dist.item.id,
          quantityDistributed: dist.quantity,
          acknowledgmentType: 'ROSTER_CONFIRMATION',
        },
      ],
    };

    try {
      if (isOnline) {
        await apiFetch('/api/thr/distribute', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const stockRes = await apiFetch(`/api/stock/awc/${user.awcId}`);
        setStockOverview(stockRes.stockOverview || []);
      } else {
        await enqueueOfflineOperation('THR_DISTRIBUTE', payload);
      }
      return true;
    } catch (err) {
      console.error('Continuous distribution error:', err);
      return false;
    }
  };

  // Create Beneficiary in Add Modal
  const handleCreateBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.awcId) return;
    if (!newFullNameEn.trim() || !newFullNameGu.trim()) {
      setModalError('Please enter name in both English and Gujarati.');
      return;
    }

    setCreatingBen(true);
    setModalError('');
    try {
      const res = await apiFetch('/api/thr/beneficiaries', {
        method: 'POST',
        body: JSON.stringify({
          awcId: user.awcId,
          fullNameEn: newFullNameEn.trim(),
          fullNameGu: newFullNameGu.trim(),
          category: newCategory,
          guardianName: newGuardian.trim() || undefined,
          dateOfBirth: new Date(newDob).toISOString(),
          gender: newGender,
        }),
      });

      if (res.beneficiary) {
        setBeneficiaries((prev) => [res.beneficiary, ...prev]);
        setShowAddModal(false);
        setNewFullNameEn('');
        setNewFullNameGu('');
        setNewGuardian('');
        openHandoverPopup(res.beneficiary);
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to register beneficiary.');
    } finally {
      setCreatingBen(false);
    }
  };

  // Filter beneficiaries
  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchesCategory = selectedCategory === 'ALL' || b.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      b.fullNameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.fullNameGu?.includes(searchQuery);
    return matchesCategory && matchesQuery;
  });

  const totalThrPackets = stockOverview
    .filter((s) => s.item?.category === 'THR_PACKET')
    .reduce((sum, s) => sum + (s.currentBalance || 0), 0);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-cream-100 select-none">
      {/* SECTION HEADER (Pastel Peach) */}
      <SectionHeader
        title={language === 'gu' ? 'THR વિતરણ' : 'THR Distribution'}
        englishTitle="TAKE-HOME RATION (THR)"
        icon={PackagePlus}
        bgColor="bg-pastel-peach"
        borderColor="border-[#FDC58A]"
        iconColor="text-pastel-peachIcon"
        actionButton={
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* CONTINUOUS LOOP SCANNER BUTTON */}
            <button
              type="button"
              onClick={() => setShowContinuousLoop(true)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-pastel-mint hover:bg-pastel-mintHover border-2 border-[#8CEFDA] text-teal-900 font-black text-xs transition active:scale-95 flex items-center space-x-1 sm:space-x-1.5 shadow-2xs cursor-pointer animate-pulse"
              title="સતત વિતરણ લૂપ (Continuous Loop Scan)"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2] text-teal-800" />
              <span className="hidden sm:inline">સતત વિતરણ લૂપ</span>
              <span className="sm:hidden font-sans">લૂપ સ્કેન</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScannerIntent('DISTRIBUTE');
                setShowQrScanner(true);
              }}
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-pastel-peach hover:bg-pastel-peachHover border-2 border-[#FDC58A] text-pastel-peachIcon font-black text-xs transition active:scale-95 flex items-center space-x-1 sm:space-x-1.5 shadow-2xs cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
              <span className="hidden md:inline">Aadhaar Barcode Scan</span>
              <span className="md:hidden">QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalError('');
                setQrNotice('');
                setShowAddModal(true);
              }}
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 border-2 border-[#E0D5C3] text-brand-navy font-black text-xs transition active:scale-95 flex items-center space-x-1 sm:space-x-1.5 shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2] text-pastel-peachIcon" />
              <span className="hidden sm:inline">+ નવો લાભાર્થી</span>
              <span className="sm:hidden">+ નવો</span>
            </button>
          </div>
        }
      />

      {/* SECTION CONTENT: Metrics, Filter Tabs, and Roster Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1">
        {/* Metric Cards Row with prominent borders */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-peach/60 border border-[#FDC58A] text-pastel-peachIcon flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'નોંધાયેલ લાભાર્થી' : 'Enrolled Roster'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                {beneficiaries.length}
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Boxes className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'હાજર સ્ટોક (પેકેટ)' : 'Available Stock'}
              </div>
              <div className="text-base sm:text-xl font-black text-brand-navy">
                {totalThrPackets}
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-wider">
                {language === 'gu' ? 'સક્રિય સાયકલ' : 'Active Cycle'}
              </div>
              <div className="text-xs sm:text-sm font-black text-emerald-800 uppercase">
                OCT-2026
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs and Search Bar */}
        <div className="bg-white/90 p-3.5 sm:p-4 rounded-2xl border-2 border-[#E0D5C3] shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'બધા (All)' },
                { id: 'CHILD_0_TO_3', label: 'બાળકો ૬ માસ-૩ વર્ષ' },
                { id: 'PREGNANT_WOMAN', label: 'સગર્ભા માતા' },
                { id: 'LACTATING_MOTHER', label: 'ધાત્રી માતા' },
                { id: 'ADOLESCENT_GIRL', label: 'કિશોરીઓ' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex-shrink-0 border ${
                    selectedCategory === cat.id
                      ? 'bg-pastel-peach text-brand-navy border-[#FDC58A] shadow-2xs'
                      : 'bg-[#FAF3E8] text-brand-navy/70 border-transparent hover:bg-cream-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'gu' ? 'નામ દ્વારા શોધો...' : 'Search by name...'}
                className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs rounded-xl border-2 border-[#E0D5C3] bg-white focus:outline-none focus:border-[#FDC58A]"
              />
            </div>
          </div>
        </div>

        {/* Beneficiaries Roster Cards */}
        <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-[#E0D5C3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E0D5C3] mb-3">
            <h2 className="text-sm sm:text-base font-black text-brand-navy font-sans">
              {language === 'gu' ? 'લાભાર્થી યાદી (વિતરણ માટે કાર્ડ પર ક્લિક કરો)' : 'Beneficiary Roster (Tap Card to Distribute)'}
            </h2>
            <span className="text-xs font-bold text-brand-navy/60">
              {filteredBeneficiaries.length} લાભાર્થી
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs font-bold text-brand-navy/50">
              લાભાર્થી યાદી લોડ થઈ રહી છે...
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-pastel-peach/30 border-2 border-dashed border-[#FDC58A] my-2">
              <Users className="w-8 h-8 text-pastel-peachIcon mx-auto mb-2 stroke-[2.2]" />
              <div className="text-sm font-black text-brand-navy">
                {language === 'gu' ? 'કોઈ લાભાર્થી મળ્યા નથી.' : 'No beneficiaries found.'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredBeneficiaries.map((ben) => (
                <div
                  key={ben.id}
                  onClick={() => openHandoverPopup(ben)}
                  className="p-3.5 rounded-xl bg-[#FFFDF9] border-2 border-[#E0D5C3] hover:border-[#FDC58A] transition shadow-2xs flex items-center justify-between gap-3 cursor-pointer group hover:bg-pastel-peach/20"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-black text-brand-navy truncate">
                      {language === 'gu' ? ben.fullNameGu || ben.fullNameEn : ben.fullNameEn}
                    </div>
                    <div className="text-[11px] text-brand-navy/60 font-semibold truncate">
                      {ben.category.replace(/_/g, ' ')} · વાલી: {ben.guardianName || 'Parent'}
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-cream-200 text-brand-navy border border-[#E0D5C3]">
                      માસિક ક્વોટા: {ben.category === 'ADOLESCENT_GIRL' ? '2 પેકેટ' : '4 પેકેટ'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openHandoverPopup(ben);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-pastel-peach hover:bg-pastel-peachHover text-pastel-peachIcon font-black text-xs border-2 border-[#FDC58A] transition active:scale-95 flex items-center space-x-1 shadow-2xs flex-shrink-0 group-hover:scale-105"
                  >
                    <span>વિતરણ કરો</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* POPUP 1: Handover Confirmation Popup with distinct distributive border */}
      {showDistributeModal && activeBeneficiary && activeItem && (
        <ModalWrapper
          isOpen={showDistributeModal}
          onClose={() => setShowDistributeModal(false)}
          title={language === 'gu' ? 'THR રાશન વિતરણ ખાતરી' : 'Confirm THR Distribution'}
          subtitle={
            language === 'gu'
              ? `${activeBeneficiary.fullNameGu || activeBeneficiary.fullNameEn} ને પેકેટ સુપરત કરો`
              : `Hand over nutrition packets to ${activeBeneficiary.fullNameEn}`
          }
          englishTitle="CONFIRM HANDOVER"
          icon={HeartHandshake}
          iconColor="text-pastel-peachIcon"
          bgColor="bg-pastel-peach"
          borderColor="border-[#FDC58A]"
          maxWidth="2xl"
          footerActions={
            distributeSuccess ? (
              <button
                type="button"
                onClick={() => setShowDistributeModal(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition active:scale-95"
              >
                પૂર્ણ (Done)
              </button>
            ) : (
              <div className="w-full flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowDistributeModal(false)}
                  className="w-1/3 py-2.5 rounded-xl border-2 border-[#E0D5C3] text-brand-navy/70 hover:bg-slate-50 font-black text-xs transition"
                >
                  રદ કરો (Cancel)
                </button>
                <button
                  type="button"
                  disabled={distributeSubmitting}
                  onClick={handleConfirmDistribution}
                  className="w-2/3 py-2.5 rounded-xl bg-pastel-peach hover:bg-pastel-peachHover border-2 border-[#FDC58A] text-pastel-peachIcon font-black text-xs transition active:scale-95 flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                  <span>
                    {distributeSubmitting ? 'નોંધાઈ રહ્યું છે...' : `વિતરણ પાકું કરો (${quantity} પેકેટ)`}
                  </span>
                </button>
              </div>
            )
          }
        >
          {distributeSuccess ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border-2 border-emerald-300">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-brand-navy">
                વિતરણ સફળતાપૂર્વક નોંધાઈ ગયું!
              </h3>
              <p className="text-xs text-brand-navy/70">
                {activeBeneficiary.fullNameGu || activeBeneficiary.fullNameEn} ને {quantity} પેકેટ {activeItem.nameEn} સફળતાપૂર્વક અપાયા છે. સ્ટોક અપડેટ થયો છે.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {distributeError && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{distributeError}</span>
                </div>
              )}

              {/* Beneficiary Details Card with clear border */}
              <div className="p-3.5 bg-white rounded-xl border-2 border-[#E0D5C3] flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-brand-navy">
                    {activeBeneficiary.fullNameGu || activeBeneficiary.fullNameEn}
                  </div>
                  <div className="text-xs text-brand-navy/60 font-semibold">
                    {activeBeneficiary.category.replace(/_/g, ' ')} · વાલી: {activeBeneficiary.guardianName || 'Parent'}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-pastel-peach text-pastel-peachIcon border border-[#FDC58A]">
                  સાયકલ: OCT-2026
                </span>
              </div>

              {/* Nutrition Item Allocation Card */}
              <div className="p-3.5 bg-[#FFFDF9] rounded-xl border-2 border-[#E0D5C3] flex items-center justify-between">
                <div>
                  <span className="text-xs text-brand-navy/60 font-bold block">ફાળવેલ પોષણ આહાર:</span>
                  <span className="text-sm font-black text-brand-navy">
                    {language === 'gu' ? activeItem.nameGu : activeItem.nameEn}
                  </span>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ગુજરાત સરકાર અનુમોદિત
                </span>
              </div>

              {/* Handover Quantity Stepper with clear border */}
              <div className="p-4 bg-white rounded-xl border-2 border-[#E0D5C3] text-center space-y-2">
                <label className="text-xs font-black text-brand-navy uppercase tracking-wider block">
                  આપવામાં આવેલ પેકેટ સંખ્યા (Handover Quantity)
                </label>
                <div className="flex justify-center py-1">
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={10}
                    unit="PACKET"
                  />
                </div>
                <span className="text-[11px] text-brand-navy/60 font-medium block">
                  માસિક હકદારી મુજબ પેકેટ આપો. + અથવા - થી ફેરફાર કરી શકાય છે.
                </span>
              </div>

              {/* Beneficiary Signature Pad */}
              <div className="p-3.5 bg-white rounded-xl border-2 border-[#E0D5C3]">
                <SignaturePad
                  onSave={setSignatureData}
                  label="લાભાર્થી / માતાની ટચસ્ક્રીન સહી (સહી / અંગૂઠો)"
                />
              </div>
            </div>
          )}
        </ModalWrapper>
      )}

      {/* POPUP 2: Add Beneficiary Popup with clear distributive border */}
      {showAddModal && (
        <ModalWrapper
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={language === 'gu' ? 'નવો લાભાર્થી ઉમેરો' : 'Add Beneficiary'}
          subtitle="આંગણવાડી રોસ્ટરમાં નવું બાળક અથવા માતા નોંધણી કરો"
          englishTitle="NEW BENEFICIARY"
          icon={UserPlus}
          iconColor="text-pastel-peachIcon"
          bgColor="bg-pastel-peach"
          borderColor="border-[#FDC58A]"
          maxWidth="lg"
          footerActions={
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-1/3 py-2.5 rounded-xl border-2 border-[#E0D5C3] text-brand-navy/70 hover:bg-slate-50 font-black text-xs transition"
              >
                રદ કરો
              </button>
              <button
                type="button"
                disabled={creatingBen}
                onClick={handleCreateBeneficiary}
                className="w-2/3 py-2.5 rounded-xl bg-pastel-peach hover:bg-pastel-peachHover border-2 border-[#FDC58A] text-pastel-peachIcon font-black text-xs transition active:scale-95 disabled:opacity-50"
              >
                {creatingBen ? 'નોંધાઈ રહ્યું છે...' : 'સાચવો અને આગળ વધો'}
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreateBeneficiary} className="space-y-3">
            {qrNotice && (
              <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-xs font-bold text-emerald-800">
                {qrNotice}
              </div>
            )}
            {modalError && (
              <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-xs font-bold text-red-700">
                {modalError}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-brand-navy uppercase tracking-wider mb-1">
                પૂરું નામ (અંગ્રેજી) *
              </label>
              <input
                type="text"
                required
                value={newFullNameEn}
                onChange={(e) => setNewFullNameEn(e.target.value)}
                placeholder="e.g. Ramesh K. Patel"
                className="w-full px-3 py-2 border-2 border-[#E0D5C3] rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-[#FDC58A]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-brand-navy uppercase tracking-wider mb-1">
                પૂરું નામ (ગુજરાતી) *
              </label>
              <input
                type="text"
                required
                value={newFullNameGu}
                onChange={(e) => setNewFullNameGu(e.target.value)}
                placeholder="દા.ત. રમેશ કે. પટેલ"
                className="w-full px-3 py-2 border-2 border-[#E0D5C3] rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-[#FDC58A]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-brand-navy uppercase tracking-wider mb-1">
                લાભાર્થી વર્ગ (Category) *
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#E0D5C3] rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-[#FDC58A]"
              >
                <option value="CHILD_0_TO_3">બાળકો (૬ માસ થી ૩ વર્ષ) - બાલશક્તિ</option>
                <option value="PREGNANT_WOMAN">સગર્ભા માતા - માતૃશક્તિ</option>
                <option value="LACTATING_MOTHER">ધાત્રી માતા - માતૃશક્તિ</option>
                <option value="ADOLESCENT_GIRL">કિશોરીઓ (૧૧-૧૮ વર્ષ) - પૂર્ણા શક્તિ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-brand-navy uppercase tracking-wider mb-1">
                વાલીનું નામ (Guardian Name)
              </label>
              <input
                type="text"
                value={newGuardian}
                onChange={(e) => setNewGuardian(e.target.value)}
                placeholder="દા.ત. મીનાબેન પટેલ"
                className="w-full px-3 py-2 border-2 border-[#E0D5C3] rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-[#FDC58A]"
              />
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* POPUP 3: Aadhaar Barcode Scanner Modal with clear distributive border */}
      {showQrScanner && (
        <AadhaarQrScanner
          onScanSuccess={handleQrScanSuccess}
          onClose={() => setShowQrScanner(false)}
        />
      )}

      {/* POPUP 4: Continuous Loop Scanner Modal (Seamless Scan, Confirm, Repeat) */}
      {showContinuousLoop && (
        <ContinuousLoopScanner
          isOpen={showContinuousLoop}
          onClose={() => {
            setShowContinuousLoop(false);
            loadData();
          }}
          beneficiaries={beneficiaries}
          items={items}
          onDistributionRecorded={handleContinuousDistributionRecorded}
        />
      )}
    </div>
  );
};
