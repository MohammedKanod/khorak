import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  parseAadhaarQrData,
  ParsedAadhaarData,
  SAMPLE_AADHAAR_QRS,
} from '../utils/aadhaarQrParser';
import {
  QrCode,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  FileText,
} from 'lucide-react';

interface AadhaarQrScannerProps {
  onScanSuccess: (data: ParsedAadhaarData) => void;
  onClose: () => void;
}

export const AadhaarQrScanner: React.FC<AadhaarQrScannerProps> = ({
  onScanSuccess,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'sample' | 'paste' | 'upload'>('sample');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedAadhaarData | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'aadhaar-qr-reader-container';

  // Cleanup scanner on unmount or tab switch
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [activeTab]);

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const startCameraScanner = async () => {
    setErrorMsg('');
    setIsScanning(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        stream.getTracks().forEach((track) => track.stop());
      }

      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleSuccessfulRawText(decodedText);
          stopScanner();
        },
        () => {
          // ignore frame errors while seeking QR
        }
      );
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setErrorMsg(
        'Camera permission was not granted or camera is not available. Please allow camera access in app/browser settings, or use 1-Click Demo QR.'
      );
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    try {
      const html5QrCode = new Html5Qrcode('aadhaar-file-hidden-reader');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleSuccessfulRawText(decodedText);
    } catch (err) {
      setErrorMsg('Could not detect an Aadhaar QR code in the uploaded image. Try another photo.');
    }
  };

  const handleSuccessfulRawText = (raw: string) => {
    setErrorMsg('');
    const parsed = parseAadhaarQrData(raw);
    if (!parsed) {
      setErrorMsg('Recognized QR data, but could not parse UIDAI Aadhaar attributes.');
      return;
    }
    setParsedPreview(parsed);
  };

  const handleApply = () => {
    if (parsedPreview) {
      onScanSuccess(parsedPreview);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-saffron-50 text-saffron-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Scan Aadhaar QR Code (આધાર QR સ્કેન)
              </h3>
              <p className="text-[11px] text-slate-500">
                Instant extraction of Name, DOB, Gender, and Guardian without manual typing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('sample');
              stopScanner();
            }}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
              activeTab === 'sample'
                ? 'bg-white text-forest-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
            <span>1-Click Demo QR</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              startCameraScanner();
            }}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
              activeTab === 'camera'
                ? 'bg-white text-forest-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-forest-700" />
            <span>Live Camera</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopScanner();
            }}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
              activeTab === 'upload'
                ? 'bg-white text-forest-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('paste');
              stopScanner();
            }}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
              activeTab === 'paste'
                ? 'bg-white text-forest-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste XML</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: 1-Click Demo Samples */}
        {activeTab === 'sample' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Select any sample card below to test instant QR decoding and smart category inference:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SAMPLE_AADHAAR_QRS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuccessfulRawText(sample.data)}
                  className="p-3 text-left border border-slate-200 hover:border-forest-600 hover:bg-forest-50/40 rounded-xl transition group flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-4 h-4 text-saffron-600 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-slate-900 group-hover:text-forest-800">
                      {sample.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                    Scan UIDAI XML payload →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Live Camera */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            <div
              id={readerElementId}
              className="w-full bg-slate-900 rounded-xl overflow-hidden min-h-[240px] flex items-center justify-center text-white text-xs"
            >
              {!isScanning && <span>Click button below to start camera</span>}
            </div>
            {!isScanning && (
              <button
                type="button"
                onClick={startCameraScanner}
                className="w-full py-2 px-3 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Start Camera Scanner</span>
              </button>
            )}
            <p className="text-[11px] text-slate-500 text-center">
              Align the square QR barcode on the back of the physical Aadhaar card inside the viewfinder.
            </p>
          </div>
        )}

        {/* Tab 3: Upload Image */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <div id="aadhaar-file-hidden-reader" className="hidden" />
            <label className="border-2 border-dashed border-slate-300 hover:border-forest-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-forest-50/30 transition text-center">
              <Upload className="w-8 h-8 text-forest-700 mb-2" />
              <span className="text-xs font-bold text-slate-800">
                Click to upload photo of Aadhaar QR
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                JPG, PNG, WebP supported
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Tab 4: Paste XML */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <textarea
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder='Paste raw UIDAI QR XML string (e.g. <PrintLetterBarcodeData name="Priya Solanki" gender="F" dob="12/04/2025" .../>)'
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:ring-forest-600 focus:border-forest-600"
            />
            <button
              type="button"
              disabled={!pasteText.trim()}
              onClick={() => handleSuccessfulRawText(pasteText)}
              className="w-full py-2 bg-forest-700 hover:bg-forest-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition"
            >
              Parse Pasted QR Data
            </button>
          </div>
        )}

        {/* Parsed Result Preview Card */}
        {parsedPreview && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
              <div className="flex items-center space-x-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-extrabold">Aadhaar QR Decoded Successfully!</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Privacy Hash OK
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Name (English):</span>
                <span className="font-bold text-slate-900">{parsedPreview.fullNameEn}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Name (Gujarati):</span>
                <span className="font-bold text-slate-900 font-gujarati">
                  {parsedPreview.fullNameGu}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Date of Birth:</span>
                <span className="font-semibold text-slate-800">{parsedPreview.dateOfBirth}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Gender:</span>
                <span className="font-semibold text-slate-800">{parsedPreview.gender}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 text-[11px] block">Mother / Guardian:</span>
                <span className="font-semibold text-slate-800">{parsedPreview.guardianName}</span>
              </div>
              <div className="col-span-2 bg-white/70 p-2 rounded-lg border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-900 block">
                  🎯 Inferred ICDS Nutrition Stream:
                </span>
                <span className="text-xs font-extrabold text-forest-800 block mt-0.5">
                  {parsedPreview.inferredCategory}
                </span>
                <span className="text-[10px] text-slate-600 block mt-0.5">
                  {parsedPreview.categoryReason}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApply}
              className="w-full py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Auto-Fill Beneficiary Form (ફોર્મ આપમેળે ભરો)</span>
            </button>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
