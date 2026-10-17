import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { enqueueOfflineOperation } from '../../db/offlineDb';
import { ModalWrapper } from '../ModalWrapper';
import { QuantityStepper } from '../QuantityStepper';
import { AadhaarQrScanner } from '../AadhaarQrScanner';
import { ContinuousLoopScanner } from '../ContinuousLoopScanner';
import { ParsedAadhaarData } from '../../utils/aadhaarQrParser';
import confetti from 'canvas-confetti';
import {
  PackagePlus,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Sparkles,
  UserPlus,
  ArrowRight,
  Boxes,
  RefreshCw,
} from 'lucide-react';

interface ThrDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ThrDistributionModal: React.FC<ThrDistributionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, apiFetch } = useAuth();
  const { language, t } = useLanguage();
  const { isOnline } = useOffline();

  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [stockOverview, setStockOverview] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any | null>(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState<number>(4);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  // Aadhaar Scanner modal state
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showContinuousLoop, setShowContinuousLoop] = useState(false);
  const [qrNotice, setQrNotice] = useState('');

  // Add beneficiary sub-flow state
  const [showAddBen, setShowAddBen] = useState(false);
  const [newFullNameEn, setNewFullNameEn] = useState('');
  const [newFullNameGu, setNewFullNameGu] = useState('');
  const [newCategory, setNewCategory] = useState('CHILD_0_TO_3');
  const [newGuardian, setNewGuardian] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSuccessResult(null);
      setError('');
      setSelectedBeneficiary(null);
      setQrNotice('');
      setShowAddBen(false);
      return;
    }

    async function loadData() {
      if (!user?.awcId) return;
      try {
        const [bRes, iRes, sRes] = await Promise.all([
          apiFetch(`/api/thr/beneficiaries/awc/${user.awcId}`),
          apiFetch('/api/items'),
          apiFetch(`/api/stock/awc/${user.awcId}`),
        ]);
        setBeneficiaries(bRes.beneficiaries || []);
        const thrItems = (iRes.items || []).filter((i: any) => i.category === 'THR_PACKET');
        setItems(thrItems);
        setStockOverview(sRes.stockOverview || []);
        if (thrItems.length > 0) {
          setSelectedItemId(thrItems[0].id);
        }
      } catch (err) {
        console.error('Failed to load THR data:', err);
      }
    }
    loadData();
  }, [isOpen, user]);

  // Handle QR scan result
  const handleQrScanSuccess = async (data: ParsedAadhaarData) => {
    setShowQrScanner(false);

    // Look for matching beneficiary in roster
    let target = beneficiaries.find(
      (b) =>
        b.fullNameEn?.toLowerCase().trim() === data.fullNameEn?.toLowerCase().trim() ||
        (data.fullNameEn && b.fullNameEn?.toLowerCase().includes(data.fullNameEn.toLowerCase()))
    );

    // If not found, auto-enroll
    if (!target && user?.awcId) {
      try {
        const res = await apiFetch('/api/thr/beneficiaries', {
          method: 'POST',
          body: JSON.stringify({
            awcId: user.awcId,
            fullNameEn: data.fullNameEn,
            fullNameGu: data.fullNameGu,
            category: data.inferredCategory,
            guardianName: data.guardianName,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
          }),
        });
        target = res.beneficiary;
        setBeneficiaries((prev) => [target, ...prev]);
        setQrNotice(
          language === 'gu'
            ? `આધાર સ્કેન દ્વારા નવા લાભાર્થી "${data.fullNameGu}" આપમેળે નોંધાઈ ગયા!`
            : `New beneficiary "${data.fullNameEn}" auto-enrolled via Aadhaar!`
        );
      } catch (err) {
        console.error('Auto-enroll failed:', err);
      }
    }

    if (target) {
      setSelectedBeneficiary(target);
      // Auto-select ration based on category
      if (target.category === 'CHILD_0_TO_3') {
        const balshakti = items.find((i) => i.code?.includes('BAL') || i.nameEn?.includes('Balshakti'));
        if (balshakti) setSelectedItemId(balshakti.id);
        setQuantity(7);
      } else if (target.category === 'PREGNANT_WOMAN' || target.category === 'LACTATING_MOTHER') {
        const matrushakti = items.find((i) => i.code?.includes('MAT') || i.nameEn?.includes('Matrushakti'));
        if (matrushakti) setSelectedItemId(matrushakti.id);
        setQuantity(4);
      }
      setQrNotice(
        language === 'gu'
          ? `આધાર ચકાસણી સફળ: ${target.fullNameGu}`
          : `Aadhaar Verified: ${target.fullNameEn}`
      );
    }
  };

  const handleCreateBeneficiary = async () => {
    if (!user?.awcId || !newFullNameEn) return;
    try {
      const res = await apiFetch('/api/thr/beneficiaries', {
        method: 'POST',
        body: JSON.stringify({
          awcId: user.awcId,
          fullNameEn: newFullNameEn,
          fullNameGu: newFullNameGu || newFullNameEn,
          category: newCategory,
          guardianName: newGuardian,
          dateOfBirth: '2024-01-01',
          gender: 'FEMALE',
        }),
      });
      const created = res.beneficiary;
      setBeneficiaries((prev) => [created, ...prev]);
      setSelectedBeneficiary(created);
      setShowAddBen(false);
      setNewFullNameEn('');
      setNewFullNameGu('');
    } catch (err: any) {
      setError(err.message || 'Error creating beneficiary');
    }
  };

  const handleSubmitDistribution = async () => {
    if (!user?.awcId || !selectedBeneficiary || !selectedItemId) return;

    setError('');
    setSubmitting(true);

    const payload = {
      awcId: user.awcId,
      beneficiaryId: selectedBeneficiary.id,
      itemId: selectedItemId,
      quantityDistributed: quantity,
      unit: 'packets',
      cycleMonth: new Date().getMonth() + 1,
      cycleYear: new Date().getFullYear(),
      distributedByUserId: user.id,
      verificationMode: 'PHYSICAL_ROSTER',
    };

    try {
      if (isOnline) {
        const res = await apiFetch('/api/thr/distribution', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessResult(res);
      } else {
        await enqueueOfflineOperation('THR_DISTRIBUTE', payload);
        setSuccessResult({
          offline: true,
          message:
            language === 'gu'
              ? 'વિતરણ સફળતાપૂર્વક સાચવાયું છે. ઑફલાઇન નોંધ થઈ ગઈ છે.'
              : 'Distribution recorded safely offline.',
        });
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error recording distribution');
    } finally {
      setSubmitting(false);
    }
  };

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
        console.warn('Continuous auto-enroll warning in modal:', err);
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
      if (onSuccess) onSuccess();
      return true;
    } catch (err) {
      console.error('Continuous distribution error in modal:', err);
      return false;
    }
  };

  // Filtered beneficiaries
  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchesCategory =
      selectedCategory === 'ALL' || b.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      b.fullNameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.fullNameGu?.includes(searchQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <>
      <ModalWrapper
        isOpen={isOpen && !showQrScanner}
        onClose={onClose}
        title={language === 'gu' ? 'THR વિતરણ (ટેક-હોમ રાશન)' : 'THR Distribution'}
        subtitle={
          language === 'gu'
            ? 'પૌષ્ટિક આહાર પેકેટ વિતરણ નોંધણી'
            : 'Record take-home ration packets to beneficiaries'
        }
        englishTitle="THR DISTRIBUTION"
        icon={PackagePlus}
        iconColor="text-pastel-peachIcon"
        bgColor="bg-pastel-peach"
        borderColor="border-[#FDC58A]"
        maxWidth="3xl"
        footerActions={
          successResult ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition active:scale-95"
            >
              {language === 'gu' ? 'પૂર્ણ થયું (બંધ કરો)' : 'Done (Close)'}
            </button>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition active:scale-95"
              >
                {language === 'gu' ? 'રદ કરો' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={!selectedBeneficiary || submitting}
                onClick={handleSubmitDistribution}
                className="px-6 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeLight text-white text-xs font-black transition active:scale-95 disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
              >
                {submitting ? (
                  <span>{language === 'gu' ? 'સાચવે છે...' : 'Saving...'}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {language === 'gu'
                        ? 'વિતરણ પૂર્ણ કરો'
                        : 'Confirm & Distribute'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )
        }
      >
        {/* SUCCESS STATE */}
        {successResult && (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-brand-navy">
              {language === 'gu'
                ? 'THR વિતરણ સફળતાપૂર્વક નોંધાઈ ગયું!'
                : 'THR Distributed Successfully!'}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {selectedBeneficiary?.fullNameGu || selectedBeneficiary?.fullNameEn} ને {quantity} પેકેટ આપ્યા. સ્ટોક બેલેન્સ અપડેટ થઈ ગયું છે.
            </p>
          </div>
        )}

        {!successResult && (
          <div className="space-y-4">
            {/* Quick Aadhaar Scan Action Banner */}
            <div className="bg-amber-50/80 p-3 sm:p-3.5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-brand-navy">
                    {language === 'gu'
                      ? 'ઝડપી વિતરણ: આધાર QR સ્કેન કરો'
                      : 'Quick Distribution: Scan Aadhaar QR'}
                  </div>
                  <div className="text-[11px] text-amber-900/80">
                    {language === 'gu'
                      ? 'કાર્ડ સ્કેન કરતાં જ લાભાર્થી આપમેળે પસંદ થશે'
                      : 'Instantly matches or auto-enrolls beneficiary'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowContinuousLoop(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer animate-pulse"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'gu' ? 'સતત લૂપ' : 'Loop Scan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrScanner(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs transition active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{language === 'gu' ? 'કાર્ડ સ્કેન' : 'Scan Card'}</span>
                </button>
              </div>
            </div>

            {qrNotice && (
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{qrNotice}</span>
              </div>
            )}

            {/* Selected Beneficiary Card (if any) */}
            {selectedBeneficiary ? (
              <div className="p-3.5 bg-pastel-peach/40 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    {language === 'gu' ? 'પસંદ કરેલ લાભાર્થી:' : 'Selected Beneficiary:'}
                  </span>
                  <div className="text-sm font-black text-brand-navy">
                    {language === 'gu'
                      ? selectedBeneficiary.fullNameGu
                      : selectedBeneficiary.fullNameEn}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {selectedBeneficiary.category} · {selectedBeneficiary.guardianName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBeneficiary(null)}
                  className="text-xs font-bold text-amber-800 hover:text-amber-900 underline"
                >
                  {language === 'gu' ? 'બદલો' : 'Change'}
                </button>
              </div>
            ) : (
              /* Beneficiary Selection & Search */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-brand-navy">
                    {language === 'gu'
                      ? '1. લાભાર્થી પસંદ કરો અથવા શોધો:'
                      : '1. Select Beneficiary:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddBen(true)}
                    className="text-xs font-bold text-brand-orange hover:text-brand-orangeLight flex items-center space-x-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{language === 'gu' ? '+ નવો ઉમેરો' : '+ Add New'}</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      language === 'gu'
                        ? 'નામ દ્વારા શોધો (Search beneficiary)...'
                        : 'Search by name...'
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-orange/50"
                  />
                </div>

                {/* Beneficiary quick roster list */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {filteredBeneficiaries.slice(0, 8).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBeneficiary(b)}
                      className="w-full p-2.5 rounded-xl border border-[#FEDEBA] bg-[#FFF9F2] hover:bg-pastel-peach text-left flex items-center justify-between transition"
                    >
                      <div>
                        <div className="text-xs font-bold text-brand-navy">
                          {language === 'gu' ? b.fullNameGu : b.fullNameEn}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {b.category} · {b.guardianName}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-brand-orange">
                        {language === 'gu' ? 'પસંદ કરો →' : 'Select →'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ration Item & Quantity Configuration */}
            {selectedBeneficiary && (
              <div className="p-3.5 bg-[#FFF5EA] rounded-2xl border border-[#FEDEBA] shadow-xs space-y-3">
                <div className="text-xs font-black text-brand-navy border-b pb-1.5">
                  {language === 'gu'
                    ? '2. વિતરણ સામગ્રી અને જથ્થો:'
                    : '2. Ration Type & Quantity:'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {language === 'gu' ? 'રાશન પ્રકાર (Ration Item):' : 'Ration Item:'}
                    </label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy"
                    >
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {language === 'gu' ? it.nameGu : it.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {language === 'gu' ? 'પેકેટ સંખ્યા (Packets):' : 'Packet Count:'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-brand-navy text-center"
                      />
                      <span className="text-xs text-slate-500 font-bold">
                        {language === 'gu' ? 'પેકેટ' : 'packets'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 font-bold">
                {error}
              </div>
            )}
          </div>
        )}
      </ModalWrapper>

      {/* Aadhaar Scanner Overlay */}
      {showQrScanner && (
        <AadhaarQrScanner
          onScanSuccess={handleQrScanSuccess}
          onClose={() => setShowQrScanner(false)}
        />
      )}

      {/* Continuous Loop Scanner Overlay */}
      {showContinuousLoop && (
        <ContinuousLoopScanner
          isOpen={showContinuousLoop}
          onClose={() => {
            setShowContinuousLoop(false);
            if (onSuccess) onSuccess();
          }}
          beneficiaries={beneficiaries}
          items={items}
          onDistributionRecorded={handleContinuousDistributionRecorded}
        />
      )}
    </>
  );
};
