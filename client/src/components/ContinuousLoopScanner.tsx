import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  parseAadhaarQrData,
  ParsedAadhaarData,
  SAMPLE_AADHAAR_QRS,
} from '../utils/aadhaarQrParser';
import { QuantityStepper } from './QuantityStepper';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  RefreshCw,
  HeartHandshake,
  ShieldCheck,
  PackagePlus,
  ArrowRight,
  Volume2,
} from 'lucide-react';

interface ContinuousLoopScannerProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiaries: any[];
  items: any[];
  onDistributionRecorded: (dist: {
    beneficiary: any;
    item: any;
    quantity: number;
    signatureData?: string;
  }) => Promise<boolean>;
}

// Synthesize pleasant handheld audio feedback via Web Audio API (zero audio file dependencies)
const playBeepChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {
    // AudioContext blocked or not supported
  }
};

const playSuccessChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Two-tone cheerful success chord
    [587.33, 880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  } catch (e) {}
};

export const ContinuousLoopScanner: React.FC<ContinuousLoopScannerProps> = ({
  isOpen,
  onClose,
  beneficiaries,
  items,
  onDistributionRecorded,
}) => {
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [sessionPackets, setSessionPackets] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');

  // Pending handover state for the currently scanned beneficiary
  const [activeHandover, setActiveHandover] = useState<{
    beneficiary: any;
    item: any;
    defaultQty: number;
    rawAadhaar?: ParsedAadhaarData;
  } | null>(null);

  const [handoverQty, setHandoverQty] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [justCompletedNotice, setJustCompletedNotice] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isHandlingScanRef = useRef<boolean>(false);
  const containerId = 'continuous-qr-reader-container';

  // Start / Stop Scanner Lifecycle
  useEffect(() => {
    if (isOpen) {
      requestCameraPermissionAndStart();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Continuous scanner stop error:', err);
      } finally {
        setIsCameraActive(false);
      }
    }
  };

  const requestCameraPermissionAndStart = async () => {
    setCameraError('');
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        // Stop the temporary test tracks before initializing Html5Qrcode
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (permErr: any) {
      console.warn('Camera permission prompt error:', permErr);
      setCameraError(
        'કેમેરા પરવાનગી જરૂરી છે (Camera Permission Required). કૃપા કરીને કેમેરાની મંજૂરી આપો અથવા નીચેના ડેમો કાર્ડ્સ વાપરો.'
      );
      setIsCameraActive(false);
      return;
    }

    await startCamera();
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: { width: 260, height: 260 },
        },
        (decodedText) => {
          if (!isHandlingScanRef.current) {
            handleDecodedBarcode(decodedText);
          }
        },
        () => {
          // Seeking frames
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera failed:', err);
      setCameraError(
        'કેમેરા શરૂ થઈ શક્યો નથી. નીચે "કેમેરા પરવાનગી આપો" બટન દબાવો અથવા ડેમો કાર્ડ્સ વડે ચકાસો.'
      );
      setIsCameraActive(false);
    }
  };

  // Process decoded Aadhaar QR code
  const handleDecodedBarcode = (rawString: string) => {
    isHandlingScanRef.current = true;
    playBeepChime();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 40, 50]);
    }

    const parsed = parseAadhaarQrData(rawString);
    if (!parsed) {
      setCameraError('Aadhaar QR ઓળખાયો નથી. કૃપા કરીને કાર્ડ યોગ્ય રીતે ધરો.');
      isHandlingScanRef.current = false;
      return;
    }

    // Match or create beneficiary object
    let target = beneficiaries.find(
      (b) =>
        b.fullNameEn?.toLowerCase().trim() === parsed.fullNameEn.toLowerCase().trim() ||
        (parsed.fullNameEn.toLowerCase().includes(b.fullNameEn?.toLowerCase()) && b.fullNameEn?.length > 3)
    );

    if (!target) {
      // Ephemeral beneficiary for instant distribution
      target = {
        id: `temp-ben-${Date.now()}`,
        fullNameEn: parsed.fullNameEn,
        fullNameGu: parsed.fullNameGu,
        category: parsed.inferredCategory,
        guardianName: parsed.guardianName || 'Guardian',
      };
    }

    // Determine appropriate THR nutrition packet item
    let matchedItem = items[0] || {
      id: 'item-balshakti',
      code: 'THR-BAL-01',
      nameEn: 'Balshakti (THR)',
      nameGu: 'બાલશક્તિ (THR)',
      unit: 'PACKET',
    };

    if (target.category === 'CHILD_0_TO_3') {
      matchedItem = items.find((i) => i.code === 'THR-BAL-01') || matchedItem;
    } else if (target.category === 'PREGNANT_WOMAN' || target.category === 'LACTATING_MOTHER') {
      matchedItem = items.find((i) => i.code === 'THR-MAT-02') || matchedItem;
    } else {
      matchedItem = items.find((i) => i.code === 'THR-PUR-03') || matchedItem;
    }

    const initialQty = target.category === 'ADOLESCENT_GIRL' ? 2 : 4;
    setHandoverQty(initialQty);

    setActiveHandover({
      beneficiary: target,
      item: matchedItem,
      defaultQty: initialQty,
      rawAadhaar: parsed,
    });
  };

  // Confirm Handover and Immediately Resume Scanner
  const handleConfirmAndNext = async () => {
    if (!activeHandover) return;

    setIsSubmitting(true);
    try {
      const ok = await onDistributionRecorded({
        beneficiary: activeHandover.beneficiary,
        item: activeHandover.item,
        quantity: handoverQty,
      });

      if (ok !== false) {
        // Celebratory feedback
        playSuccessChime();
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });

        const benName =
          activeHandover.beneficiary.fullNameGu || activeHandover.beneficiary.fullNameEn;
        setJustCompletedNotice(`✓ ${benName} ને ${handoverQty} પેકેટ સુપરત થયા!`);
        setSessionCount((prev) => prev + 1);
        setSessionPackets((prev) => prev + handoverQty);

        // Clear active handover sheet
        setActiveHandover(null);

        // Resume continuous loop scanning immediately
        setTimeout(() => {
          isHandlingScanRef.current = false;
        }, 1200);
      }
    } catch (err) {
      console.error('Continuous handover submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipOrRescan = () => {
    setActiveHandover(null);
    setTimeout(() => {
      isHandlingScanRef.current = false;
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-brand-navy/70 backdrop-blur-sm animate-in fade-in select-none overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-[#FAF3E8] rounded-3xl border-2 sm:border-[2.5px] border-[#8CEFDA] shadow-2xl flex flex-col max-h-[96dvh] overflow-hidden">
        {/* HEADER: Session Metrics & Exit Button */}
        <div className="bg-pastel-mint/80 border-b-2 border-[#8CEFDA] px-3.5 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/90 text-teal-900 border border-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-teal-800 animate-spin-slow stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs sm:text-sm font-black text-brand-navy truncate">
                  સતત વિતરણ લૂપ
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-teal-800 text-white uppercase tracking-wider">
                  Loop Active
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-brand-navy/70 font-semibold truncate">
                સ્કેન કરો → ખાતરી કરો → તરત જ આગળ વધો
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Live Session Counter Pill */}
            <div className="px-2.5 py-1 rounded-xl bg-white border border-[#8CEFDA] shadow-2xs text-center">
              <div className="text-[9px] text-teal-900/60 font-bold uppercase leading-none">
                આજના સત્રમાં
              </div>
              <div className="text-xs sm:text-sm font-black text-teal-900 leading-tight">
                {sessionCount} <span className="text-[10px] font-bold">લાભાર્થી</span>
              </div>
            </div>

            {/* Exit Session Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/60 text-brand-navy/70 hover:text-brand-navy transition active:scale-95"
              title="સત્ર પૂર્ણ કરો (Exit)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY: Viewfinder + Handover Confirmation Sheet */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 relative flex flex-col justify-between">
          {/* Recent completed feedback banner */}
          {justCompletedNotice && (
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>{justCompletedNotice}</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">
                કુલ પેકેટ: {sessionPackets}
              </span>
            </div>
          )}

          {cameraError && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
              <button
                type="button"
                onClick={requestCameraPermissionAndStart}
                className="px-3 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 self-start sm:self-auto cursor-pointer shadow-sm active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>કેમેરા પરવાનગી આપો (Allow)</span>
              </button>
            </div>
          )}

          {/* Camera Viewfinder Box */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner flex items-center justify-center flex-shrink-0">
            <div id={containerId} className="w-full h-full object-cover" />

            {/* Viewfinder Target Reticle */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-[#8CEFDA] rounded-2xl relative">
                {/* Corner accent marks */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-white rounded-br-lg" />

                {/* Sweeping laser scan beam */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#8CEFDA] to-transparent shadow-[0_0_8px_#8CEFDA] animate-pulse absolute top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
              <span className="px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-xs">
                Aadhaar કાર્ડનો QR કોડ ચોરસમાં ધરો
              </span>
            </div>
          </div>

          {/* Quick Demo QR Selector (for instant 1-click testing on laptop or phone) */}
          <div className="bg-white/80 rounded-2xl p-2.5 border border-[#E0D5C3]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase text-brand-navy/60 tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-brand-orange" />
                <span>1-ક્લિક ડેમો કાર્ડ્સ (ઝડપી ચકાસણી)</span>
              </span>
              <span className="text-[10px] text-brand-navy/50 font-mono">Instant Tap</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {SAMPLE_AADHAAR_QRS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDecodedBarcode(sample.data)}
                  className="p-1.5 text-left rounded-xl bg-cream-100 hover:bg-pastel-peach border border-[#E0D5C3] hover:border-[#FDC58A] transition active:scale-95 cursor-pointer"
                >
                  <div className="text-[11px] font-black text-brand-navy truncate">
                    {sample.label.split('(')[0]}
                  </div>
                  <div className="text-[9px] text-brand-navy/60 truncate font-sans">
                    {sample.label.includes('Child') ? 'બાળક ૬મા-૩વ' : 'સગર્ભા માતા'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* INLINE POPUP / BOTTOM CONFIRMATION SHEET: Appears instantly upon scan */}
          {activeHandover && (
            <div className="p-3 sm:p-4 rounded-2xl bg-white border-2 border-[#FDC58A] shadow-xl space-y-3 animate-in slide-in-from-bottom-4 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#FDC58A]/40">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-pastel-peach text-pastel-peachIcon border border-[#FDC58A] flex items-center justify-center flex-shrink-0">
                    <HeartHandshake className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-brand-navy truncate">
                      {activeHandover.beneficiary.fullNameGu ||
                        activeHandover.beneficiary.fullNameEn}
                    </h4>
                    <span className="text-[10px] text-brand-navy/60 font-semibold block truncate">
                      {activeHandover.beneficiary.category.replace(/_/g, ' ')} · વાલી:{' '}
                      {activeHandover.beneficiary.guardianName}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-pastel-peach text-pastel-peachIcon border border-[#FDC58A]">
                  સાયકલ: OCT-2026
                </span>
              </div>

              {/* Nutrition item & Quantity Stepper */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FFFDF9] border border-[#E0D5C3]">
                <div className="min-w-0">
                  <span className="text-[10px] text-brand-navy/60 font-bold block">
                    ફાળવેલ પોષણ આહાર:
                  </span>
                  <span className="text-xs font-black text-brand-navy truncate block">
                    {activeHandover.item.nameGu || activeHandover.item.nameEn}
                  </span>
                </div>

                <QuantityStepper
                  value={handoverQty}
                  onChange={setHandoverQty}
                  min={1}
                  max={10}
                  unit="PACKET"
                />
              </div>

              {/* SEAMLESS 1-TAP CONFIRM & NEXT BUTTON */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleSkipOrRescan}
                  className="w-1/3 py-2.5 rounded-xl border border-[#E0D5C3] text-brand-navy/70 hover:bg-slate-50 font-black text-xs transition cursor-pointer active:scale-95"
                >
                  ફરી સ્કેન
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmAndNext}
                  className="w-2/3 py-2.5 rounded-xl bg-pastel-peach hover:bg-pastel-peachHover border-2 border-[#FDC58A] text-pastel-peachIcon font-black text-xs transition active:scale-95 flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                  <span>
                    {isSubmitting
                      ? 'નોંધાઈ રહ્યું છે...'
                      : `✓ વિતરણ આપો & આગળ સ્કેન કરો (${handoverQty})`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER: Session summary */}
        <div className="bg-white/90 border-t-2 border-[#E0D5C3] px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] font-bold text-brand-navy/60">
            સતત લૂપ: સ્કેન કર્યા પછી ફોર્મ આપમેળે રીસેટ થઈ આગળ વધશે.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-cream-200 hover:bg-cream-300 text-brand-navy font-black text-xs transition active:scale-95 border border-[#E0D5C3] cursor-pointer"
          >
            સત્ર પૂર્ણ (Finish)
          </button>
        </div>
      </div>
    </div>
  );
};
