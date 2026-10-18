import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneHeader } from '../components/SceneHeader';
import { GujaratiCaption } from '../components/GujaratiCaption';

export const Scene5Supervisor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const step1 = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const step2 = spring({ frame: frame - 65, fps, config: { damping: 14 } });
  const step3 = spring({ frame: frame - 115, fps, config: { damping: 14 } });

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
      {/* Left Column: Supervisor Accountability Workflow */}
      <div style={{ flex: 1, maxWidth: 860, zIndex: 10 }}>
        <SceneHeader
          badge="SECTOR OVERSIGHT · MUKHYA SEVIKA"
          badgeBg="#B45309"
          title="Instant supervisory visibility for every shortage."
          subtitle="Shortages are not buried under aggregated numbers. KHORAK creates an immutable audit trail requiring supervisor review."
        />

        {/* 3 Step Review Process Diagram */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 32 }}>
          {/* Step 1 */}
          <div
            style={{
              opacity: step1,
              transform: `translateX(${(1 - step1) * -20}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 20px',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              border: '2px solid #FDA4AF',
              maxWidth: 580,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              ⚠️
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: BRAND_COLORS.roseShortage }}>
                Automatic Discrepancy Generation
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                ચલણ CH-GSCSCL-4410 પર ૨૦ પેકેટની ઘટ આપોઆપ સુપરવાઇઝરને મોકલાઈ
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              opacity: step2,
              transform: `translateX(${(1 - step2) * -20}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 20px',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              border: '2px solid #FDC58A',
              maxWidth: 580,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              📋
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: BRAND_COLORS.navy }}>
                Batch & Supplier Identification
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                ડિલિવરી વાહન નંબર અને ડ્રાઈવર વિગતો સાથે ઓડિટ લોગ તૈયાર થાય છે
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div
            style={{
              opacity: step3,
              transform: `translateX(${(1 - step3) * -20}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 20px',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              border: '2px solid #8CEFDA',
              maxWidth: 580,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              ✅
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#047857' }}>
                Actionable Investigation & Resolution
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                સુપરવાઇઝર સ્થળ તપાસ, પુનઃગણતરી અથવા સપ્લાયરને સુધારેલ બિલ મોકલી શકે છે
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Supervisor App Screenshot */}
      <div style={{ marginRight: 40 }}>
        <PhoneFrame
          imageSrc="screenshots/07-discrepancies.png"
          highlightBox={{
            top: '22%',
            left: '6%',
            width: '88%',
            height: '24%',
            label: 'વિસંગતતા: CH-GSCSCL-4410 (ઘટ: ૨૦)',
          }}
        />
      </div>

      <GujaratiCaption
        gujarati="મુખ્ય સેવિકા (સુપરવાઇઝર) દ્વારા વિસંગતતા સમીક્ષા અને ચકાસણી"
        english="Supervisor review creates actionable accountability for every missing packet"
        icon="🛡️"
      />
    </div>
  );
};
