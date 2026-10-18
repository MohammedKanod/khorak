import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneHeader } from '../components/SceneHeader';
import { GujaratiCaption } from '../components/GujaratiCaption';

export const Scene5Ledger: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eqSpring = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  const switchImage = frame > 240;

  const pulse = interpolate(frame - 200, [0, 10, 20], [1, 1.1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
      {/* Left Column: Arithmetic Equation & Usable Stock Rule */}
      <div style={{ flex: 1, maxWidth: 860, zIndex: 10 }}>
        <SceneHeader
          badge="STEP 4 · LIVE RUNNING STOCK ENGINE"
          badgeBg={BRAND_COLORS.forest}
          title="Automated, tamper-proof running ledger."
          subtitle="KHORAK credits only the verified 80 packets received. When 15 packets are handed over to Aadhaar-verified beneficiaries, the balance automatically becomes 65."
        />

        {/* Dynamic Calculation Board */}
        <div
          style={{
            marginTop: 32,
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: '28px 32px',
            border: '2px solid #E2E8F0',
            boxShadow: '0 15px 35px rgba(0,0,0,0.06)',
            maxWidth: 620,
            transform: `scale(${eqSpring})`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Live Anganwadi Stock Engine (સ્વચાલિત સ્ટોક ગણતરી)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Accepted Receipts */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: BRAND_COLORS.forest }}>
                80
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginTop: 4 }}>
                RECEIVED
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>Challan 4410</div>
            </div>

            <div style={{ fontSize: 36, fontWeight: 900, color: '#94A3B8' }}>−</div>

            {/* Distributed */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: BRAND_COLORS.orange }}>
                15
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginTop: 4 }}>
                DISTRIBUTED
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>Aadhaar Loop</div>
            </div>

            <div style={{ fontSize: 36, fontWeight: 900, color: '#94A3B8' }}>=</div>

            {/* Live Remaining Balance */}
            <div style={{ textAlign: 'center', transform: `scale(${pulse})` }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: '#2563EB' }}>
                65
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF', marginTop: 4 }}>
                REMAINING
              </div>
              <div style={{ fontSize: 11, color: '#3B82F6', fontWeight: 700 }}>Live Verified Stock</div>
            </div>
          </div>

          <div
            style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#64748B',
              fontWeight: 600,
            }}
          >
            <span>Formula: Opening (0) + Intakes (80) − Distributed (15)</span>
            <span style={{ color: '#059669', fontWeight: 800 }}>✓ Zero Ledger Errors</span>
          </div>
        </div>
      </div>

      {/* Right Column: Running Frontline Mobile App */}
      <div style={{ zIndex: 20 }}>
        <PhoneFrame
          imageSrc={switchImage ? 'screenshots/05-stock-balance.png' : 'screenshots/04-stock-ledger.png'}
          label={switchImage ? 'REAL APP · VERIFIED REMAINING STOCK (65)' : 'REAL APP · DOUBLE-ENTRY STOCK LEDGER (+80 / -15)'}
          highlightRect={
            switchImage
              ? { x: 20, y: 160, width: 380, height: 180 }
              : { x: 20, y: 180, width: 380, height: 260 }
          }
        />
      </div>

      <GujaratiCaption
        gujarati="વાસ્તવિક સ્ટોક ખાતાવહી · પ્રાપ્ત ૮૦ - વિતરિત ૧૫ = બાકી ૬૫ પેકેટ સચોટ હિસાબ"
        english="Verified Stock Math · 80 Received − 15 Distributed = 65 Packets Live Balance"
      />
    </div>
  );
};
