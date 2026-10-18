import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneHeader } from '../components/SceneHeader';
import { GujaratiCaption } from '../components/GujaratiCaption';

export const Scene6SpoilageHeatmap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1 (0 - 270): Spoilage & Write-Off Reporting (14-spoilage-reporting.png)
  // Phase 2 (270 - 540): Sector Heatmap & Supervisor Discrepancy Oversight (15-sector-heatmap.png)
  const isHeatmapPhase = frame > 270;
  const activeImage = isHeatmapPhase ? 'screenshots/15-sector-heatmap.png' : 'screenshots/14-spoilage-reporting.png';
  const activeLabel = isHeatmapPhase ? 'REAL APP · SUPERVISOR SECTOR HEATMAP' : 'REAL APP · AUDITABLE SPOILAGE LOGGING';

  const step1 = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const step2 = spring({ frame: frame - 140, fps, config: { damping: 14 } });
  const step3 = spring({ frame: frame - 280, fps, config: { damping: 14 } });

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
      {/* Left Column: Spoilage Control & Sector Heatmap */}
      <div style={{ flex: 1, maxWidth: 860, zIndex: 10 }}>
        <SceneHeader
          badge="STEP 5 · WASTAGE CONTROL & SECTOR HEATMAP"
          badgeBg="#DC2626"
          title="Zero hidden spoilage. Real-time sector alerts."
          subtitle="Addressing the CAG Gujarat finding on unrecorded storage damage. Spoilage is logged with photo evidence and monitored across all 25–30 centres in the sector."
        />

        {/* 3 Pillars of Oversight */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28, maxWidth: 660 }}>
          {/* Pillar 1: Photo & Voice Spoilage Flag */}
          <div
            style={{
              opacity: step1,
              transform: `translateX(${(1 - step1) * -20}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 18px',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              border: !isHeatmapPhase ? '2px solid #FDA4AF' : '2px solid #E2E8F0',
              boxShadow: '0 6px 18px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              📸
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: BRAND_COLORS.roseShortage }}>
                Evidence-Based Spoilage Logging (બગાડ અને નુકસાન નોંધ)
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                Photo upload & reason codes (Rodent damage, moisture, expiry) with GPS & timestamp.
              </div>
            </div>
          </div>

          {/* Pillar 2: Predictive Stockout Alerts */}
          <div
            style={{
              opacity: step2,
              transform: `translateX(${(1 - step2) * -20}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 18px',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              border: '2px solid #FDC58A',
              boxShadow: '0 6px 18px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              ⏳
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#C2410C' }}>
                Predictive Stockout Alerts (અગાઉથી ચેતવણી)
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                Calculates rolling consumption to warn workers 7 days before rations run dry.
              </div>
            </div>
          </div>

          {/* Pillar 3: Supervisor Sector Heatmap */}
          <div
            style={{
              opacity: step3,
              transform: `translateX(${(1 - step3) * -20}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 18px',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              border: isHeatmapPhase ? '2px solid #2563EB' : '2px solid #E2E8F0',
              boxShadow: '0 6px 18px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🗺️
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#1D4ED8' }}>
                Live Sector Heatmap (સેક્ટર હીટમેપ નિરીક્ષણ)
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                Instant Red/Amber/Green status across all 25–30 AWCs for Mukhya Sevikas & CDPOs.
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
            isHeatmapPhase
              ? { x: 20, y: 140, width: 380, height: 260 }
              : { x: 20, y: 160, width: 380, height: 220 }
          }
        />
      </div>

      <GujaratiCaption
        gujarati="બગાડની ચોક્કસ નોંધણી અને સેક્ટર હીટમેપ દ્વારા તાત્કાલિક નિરીક્ષણ"
        english="Auditable Spoilage Logging & Live Sector Oversight for Supervisors"
      />
    </div>
  );
};
