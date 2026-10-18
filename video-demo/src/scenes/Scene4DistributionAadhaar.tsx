import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneHeader } from '../components/SceneHeader';
import { GujaratiCaption } from '../components/GujaratiCaption';

export const Scene4DistributionAadhaar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Multi-phase transition across the live app workflow:
  // Phase 1 (0 - 160): THR Roster & Action Bar (10-thr-roster.png)
  // Phase 2 (160 - 330): Aadhaar QR Scanner Viewport (11-aadhaar-scanner-modal.png)
  // Phase 3 (330 - 550): Continuous Loop Handover Confirmation (13-handover-confirmation.png)
  let activeImage = 'screenshots/10-thr-roster.png';
  let activeLabel = 'REAL APP · THR BENEFICIARY ROSTER';

  if (frame > 330) {
    activeImage = 'screenshots/13-handover-confirmation.png';
    activeLabel = 'REAL APP · CONTINUOUS LOOP AADHAAR HANDOVER';
  } else if (frame > 160) {
    activeImage = 'screenshots/11-aadhaar-scanner-modal.png';
    activeLabel = 'REAL APP · AADHAAR QR SCANNER VIEWPORT';
  }

  const zoom = interpolate(frame, [160, 220, 330, 390], [1, 1.12, 1.12, 1.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const panY = interpolate(frame, [160, 220, 330, 390], [0, -60, -60, -90], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const headerSpring = spring({ frame, fps, config: { damping: 14 } });
  const step1Spring = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  const step2Spring = spring({ frame: frame - 160, fps, config: { damping: 14 } });
  const step3Spring = spring({ frame: frame - 330, fps, config: { damping: 14 } });

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: BRAND_COLORS.cream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 100px',
        overflow: 'hidden',
      }}
    >
      {/* Left Column: Aadhaar Scanning Workflow & Beneficiary Verification */}
      <div style={{ flex: 1, maxWidth: 860, zIndex: 10 }}>
        <div style={{ transform: `scale(${headerSpring})` }}>
          <SceneHeader
            badge="STEP 3 · AADHAAR VERIFICATION & DISTRIBUTION"
            badgeBg="#059669"
            title="Closing the beneficiary verification gap."
            subtitle="Anganwadi workers scan the QR code on the back of the Aadhaar card to auto-detect age, assign the exact ration category, and log handovers in seconds."
          />
        </div>

        {/* 3 Step Interactive Workflow Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28, maxWidth: 660 }}>
          {/* Step 1: Aadhaar QR Scan */}
          <div
            style={{
              opacity: step1Spring,
              transform: `translateX(${(1 - step1Spring) * -20}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 18px',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              border: frame <= 160 ? '2px solid #059669' : '2px solid #E2E8F0',
              boxShadow: '0 6px 18px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 900,
                color: '#059669',
              }}
            >
              1
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: BRAND_COLORS.navy }}>
                Instant Aadhaar QR Scan (આધાર બારકોડ સ્કેન)
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                Offline XML parses Name, DOB & Gender with zero typing needed.
              </div>
            </div>
          </div>

          {/* Step 2: Auto-Entitlement Match */}
          <div
            style={{
              opacity: step2Spring,
              transform: `translateX(${(1 - step2Spring) * -20}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 18px',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              border: frame > 160 && frame <= 330 ? '2px solid #059669' : '2px solid #E2E8F0',
              boxShadow: '0 6px 18px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 900,
                color: '#D97706',
              }}
            >
              2
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: BRAND_COLORS.navy }}>
                Auto-Entitlement Match (યોગ્ય રાશન નિર્ધારણ)
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                Child (0–3 Yrs) → Balshakti | Pregnant/Lactating Mother → Matrushakti.
              </div>
            </div>
          </div>

          {/* Step 3: Continuous Loop Handover */}
          <div
            style={{
              opacity: step3Spring,
              transform: `translateX(${(1 - step3Spring) * -20}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 18px',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              border: frame > 330 ? '2px solid #059669' : '2px solid #E2E8F0',
              boxShadow: '0 6px 18px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 900,
                color: '#2563EB',
              }}
            >
              3
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: BRAND_COLORS.navy }}>
                Continuous Loop Scan & Repeat (સતત વિતરણ લૂપ)
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                Confirm quantity, hand over packets, auto-decrement stock, and scan next card!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Running Frontline Mobile App with Live Action */}
      <div style={{ zIndex: 20 }}>
        <PhoneFrame
          imageSrc={activeImage}
          label={activeLabel}
          zoom={zoom}
          panY={panY}
          highlightRect={
            frame > 330
              ? { x: 20, y: 380, width: 380, height: 260 }
              : frame > 160
              ? { x: 40, y: 220, width: 340, height: 340 }
              : undefined
          }
        />
      </div>

      <GujaratiCaption
        gujarati="આધાર QR સ્કેન · સતત વિતરણ લૂપ દ્વારા લાભાર્થીઓની વાસ્તવિક ચકાસણી"
        english="Aadhaar QR Scanning · Continuous Loop Handover & Instant Roster Verification"
      />
    </div>
  );
};
