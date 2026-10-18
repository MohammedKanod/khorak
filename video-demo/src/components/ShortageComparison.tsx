import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';

interface ShortageComparisonProps {
  expected: number;
  received: number;
  shortage: number;
  commodity?: string;
  style?: React.CSSProperties;
}

export const ShortageComparison: React.FC<ShortageComparisonProps> = ({
  expected = 100,
  received = 80,
  shortage = 20,
  commodity = 'Balshakti (THR)',
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Step 1: Expected appears at frame 0
  const anim1 = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  // Step 2: Received appears at frame 35
  const anim2 = spring({ frame: frame - 45, fps, config: { damping: 14 } });
  // Step 3: Shortage appears with impact pulse at frame 85
  const anim3 = spring({ frame: frame - 90, fps, config: { damping: 12, stiffness: 140 } });

  const pulse = interpolate(frame - 90, [0, 8, 16], [1, 1.08, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
        maxWidth: 580,
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: '28px 32px',
        border: '2px solid #E2E8F0',
        boxShadow: '0 20px 45px -10px rgba(0,0,0,0.08)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #F1F5F9', paddingBottom: 14 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Commodity Batch Verification
          </span>
          <div style={{ fontSize: 18, fontWeight: 900, color: BRAND_COLORS.navy, marginTop: 2 }}>
            {commodity} · GCMMF Amul
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 8, backgroundColor: '#FEF3C7', color: '#B45309' }}>
          CH-GSCSCL-4410
        </span>
      </div>

      {/* Row 1: Expected */}
      <div style={{ opacity: anim1, transform: `translateX(${(1 - anim1) * -20}px)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#475569' }}>
            Expected Quantity (ચલણ મુજબ અપેક્ષિત)
          </span>
          <span style={{ fontSize: 16, fontWeight: 900, color: BRAND_COLORS.navy }}>
            {expected} Packets
          </span>
        </div>
        <div style={{ width: '100%', height: 14, backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, anim1 * 100)}%`, height: '100%', backgroundColor: '#64748B', borderRadius: 8 }} />
        </div>
      </div>

      {/* Row 2: Received */}
      <div style={{ opacity: anim2, transform: `translateX(${(1 - anim2) * -20}px)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#047857' }}>
            Physically Accepted (ખરેખર સ્વીકારેલ)
          </span>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#047857' }}>
            {received} Packets (80%)
          </span>
        </div>
        <div style={{ width: '100%', height: 14, backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(80, anim2 * 80)}%`, height: '100%', backgroundColor: '#10B981', borderRadius: 8 }} />
        </div>
      </div>

      {/* Row 3: Shortage Alert */}
      <div
        style={{
          opacity: anim3,
          transform: `scale(${anim3 > 0 ? pulse : 0.9})`,
          backgroundColor: '#FFF1F2',
          border: '2px solid #FDA4AF',
          borderRadius: 18,
          padding: '16px 20px',
          marginTop: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: BRAND_COLORS.roseShortage }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: BRAND_COLORS.roseShortage }}>
                SHORTAGE / DISCREPANCY RECORDED
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9F1239' }}>
                વિસંગતતા: 20 પેકેટ ઓછા નોંધાયા
              </div>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: BRAND_COLORS.roseShortage }}>
            - {shortage}
          </div>
        </div>
      </div>
    </div>
  );
};
