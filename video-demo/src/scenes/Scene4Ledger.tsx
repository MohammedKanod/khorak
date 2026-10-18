import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneHeader } from '../components/SceneHeader';
import { GujaratiCaption } from '../components/GujaratiCaption';

export const Scene4Ledger: React.FC = () => {
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
          badge="STEP 3 · VERIFIED STOCK LEDGER"
          badgeBg={BRAND_COLORS.forest}
          title="What arrived enters stock. Nothing more."
          subtitle="KHORAK credits only the verified 80 packets. When 15 packets are handed over to mothers, the balance accurately updates to 65."
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
            Live Anganwadi Stock Math (વાસ્તવિક સ્ટોક ગણતરી)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* 80 Accepted */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#047857' }}>80</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#047857', marginTop: 4 }}>
                RECEIVED
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>સ્વીકારેલ જથ્થો</div>
            </div>

            <div style={{ fontSize: 32, fontWeight: 900, color: '#94A3B8' }}>−</div>

            {/* 15 Distributed */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: BRAND_COLORS.orange }}>15</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: BRAND_COLORS.orange, marginTop: 4 }}>
                DISTRIBUTED
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>લાભાર્થી વિતરણ</div>
            </div>

            <div style={{ fontSize: 32, fontWeight: 900, color: '#94A3B8' }}>=</div>

            {/* 65 Remaining Balance */}
            <div
              style={{
                textAlign: 'center',
                backgroundColor: '#EFF6FF',
                border: '2px solid #BFDBFE',
                borderRadius: 16,
                padding: '10px 18px',
                transform: `scale(${pulse})`,
              }}
            >
              <div style={{ fontSize: 48, fontWeight: 900, color: '#1D4ED8' }}>65</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', marginTop: 2 }}>
                LIVE BALANCE
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6' }}>હાલનો સ્ટોક</div>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: '12px 16px',
              borderRadius: 12,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              fontSize: 13,
              fontWeight: 600,
              color: '#475569',
              lineHeight: 1.4,
            }}
          >
            🛡️ <strong>Zero Ghost Inventory:</strong> Legacy registers often record the expected 100 on day one, hiding shortages. KHORAK prevents fictitious stock accumulation.
          </div>
        </div>
      </div>

      {/* Right Column: Live App Stock Ledger Screen */}
      <div style={{ marginRight: 40 }}>
        <PhoneFrame
          imageSrc={switchImage ? 'screenshots/05-stock-balance.png' : 'screenshots/04-stock-ledger.png'}
          highlightBox={
            switchImage
              ? {
                  top: '18%',
                  left: '6%',
                  width: '88%',
                  height: '22%',
                  label: 'શિલ્લક સ્ટોક: ૬૫ પેકેટ',
                }
              : {
                  top: '28%',
                  left: '6%',
                  width: '88%',
                  height: '24%',
                  label: 'લેજર એન્ટ્રી: +૮૦ / -૧૫',
                }
          }
        />
      </div>

      <GujaratiCaption
        gujarati="૮૦ મેળવ્યા − ૧૫ વિતરણ = ૬૫ શિલ્લક સ્ટોક બાકી"
        english="80 received − 15 distributed = 65 live remaining balance"
        icon="📊"
      />
    </div>
  );
};
