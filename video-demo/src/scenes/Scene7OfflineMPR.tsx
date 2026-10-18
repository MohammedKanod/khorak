import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneHeader } from '../components/SceneHeader';
import { GujaratiCaption } from '../components/GujaratiCaption';

export const Scene7OfflineMPR: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1 (0 - 240): Offline Sync Centre & IndexedDB Outbox (06-sync-centre.png)
  // Phase 2 (240 - 480): Auto-Generated Monthly Progress Report Form 6 (08-reports-mpr.png)
  const isMprPhase = frame > 240;
  const activeImage = isMprPhase ? 'screenshots/08-reports-mpr.png' : 'screenshots/06-sync-centre.png';
  const activeLabel = isMprPhase ? 'REAL APP · AUTO-GENERATED FORM 6 MPR' : 'REAL APP · OFFLINE OUTBOX & AUTO-SYNC';

  const card1 = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const card2 = spring({ frame: frame - 225, fps, config: { damping: 14 } });

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
      {/* Left Column: Offline Resilience & One-Click MPR */}
      <div style={{ flex: 1, maxWidth: 860, zIndex: 10 }}>
        <SceneHeader
          badge="STEP 6 · OFFLINE SYNC & INSTANT MPR"
          badgeBg="#4F46E5"
          title="Engineered for rural connectivity. Zero pre-sector meeting lag."
          subtitle="Works completely without internet in Panchmahal's interior villages, and auto-compiles the official Form 6 MPR in a single tap."
        />

        {/* 2 Major Engineering Breakthroughs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 28, maxWidth: 660 }}>
          {/* Feature 1: Offline Local DB */}
          <div
            style={{
              opacity: card1,
              transform: `translateX(${(1 - card1) * -20}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 20px',
              borderRadius: 18,
              backgroundColor: '#FFFFFF',
              border: !isMprPhase ? '2px solid #8CEFDA' : '2px solid #E2E8F0',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              📶
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: BRAND_COLORS.forest }}>
                Local-First Outbox (ઓફલાઇન કાર્યપદ્ધતિ)
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', lineHeight: 1.4 }}>
                All deliveries & Aadhaar distributions store in on-device IndexedDB. Seamless background sync when connected.
              </div>
            </div>
          </div>

          {/* Feature 2: 1-Click Form 6 MPR */}
          <div
            style={{
              opacity: card2,
              transform: `translateX(${(1 - card2) * -20}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 20px',
              borderRadius: 18,
              backgroundColor: '#FFFFFF',
              border: isMprPhase ? '2px solid #4F46E5' : '2px solid #E2E8F0',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              📊
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#3730A3' }}>
                1-Tap Auto MPR (માસિક પ્રગતિ અહેવાલ)
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', lineHeight: 1.4 }}>
                Eliminates the dreaded pre-sector meeting. Auto-compiles opening stock, receipts, consumption, and closing balance.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Running Frontline Mobile App */}
      <div style={{ zIndex: 20 }}>
        <PhoneFrame
          imageSrc={activeImage}
          label={activeLabel}
          highlightRect={
            isMprPhase
              ? { x: 20, y: 160, width: 380, height: 280 }
              : { x: 20, y: 160, width: 380, height: 240 }
          }
        />
      </div>

      <GujaratiCaption
        gujarati="સંપૂર્ણ ઓફલાઇન સુવિધા અને એક ક્લિકમાં માસિક પ્રગતિ અહેવાલ (MPR) નિર્માણ"
        english="Full Offline Resilience & 1-Click Monthly Progress Report (MPR) Generation"
      />
    </div>
  );
};
