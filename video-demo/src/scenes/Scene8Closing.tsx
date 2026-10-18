import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';

export const Scene8Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const textSpring = spring({ frame: frame - 35, fps, config: { damping: 14 } });
  const tagSpring = spring({ frame: frame - 65, fps, config: { damping: 14 } });
  const outcomesSpring = spring({ frame: frame - 95, fps, config: { damping: 14 } });
  const badgeSpring = spring({ frame: frame - 125, fps, config: { damping: 14 } });

  const pulse = interpolate(frame % 60, [0, 30, 60], [1, 1.04, 1]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: BRAND_COLORS.cream,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 50,
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Circles */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          opacity: 0.6,
          boxShadow: '0 0 100px rgba(254, 243, 199, 0.8)',
          pointerEvents: 'none',
        }}
      />

      {/* Emblem / Logo */}
      <div
        style={{
          transform: `scale(${logoSpring * pulse})`,
          width: 110,
          height: 110,
          borderRadius: 30,
          backgroundColor: BRAND_COLORS.forest,
          border: '4px solid #E85D04',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 25px 60px -10px rgba(30, 62, 43, 0.45)',
          marginBottom: 20,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 50 }}>🌾</span>
      </div>

      {/* Brand Title */}
      <div
        style={{
          transform: `scale(${textSpring})`,
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: BRAND_COLORS.forest,
            margin: 0,
            letterSpacing: '-0.03em',
            textShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}
        >
          KHORAK · <span style={{ color: BRAND_COLORS.orange }}>ખોરાક</span>
        </h1>
        <p
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#64748B',
            marginTop: 6,
            marginBottom: 0,
            letterSpacing: '0.04em',
          }}
        >
          INVENTORY & NUTRITION SUPPLY CHAIN TRACKER FOR ANGANWADI CENTERS
        </p>
      </div>

      {/* Tagline */}
      <div
        style={{
          transform: `scale(${tagSpring})`,
          marginTop: 18,
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: BRAND_COLORS.navy,
            letterSpacing: '-0.02em',
          }}
        >
          From dispatch to distribution. Every quantity accounted for.
        </div>
      </div>

      {/* 4 Summary Outcome Pills */}
      <div
        style={{
          opacity: outcomesSpring,
          transform: `translateY(${(1 - outcomesSpring) * 20}px)`,
          display: 'flex',
          gap: 12,
          marginTop: 24,
          zIndex: 10,
        }}
      >
        <div style={{ backgroundColor: '#FFFFFF', padding: '10px 18px', borderRadius: 999, border: '2px solid #8CEFDA', fontSize: 13, fontWeight: 800, color: BRAND_COLORS.forest }}>
          ✓ Verified Intake
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: '10px 18px', borderRadius: 999, border: '2px solid #FDC58A', fontSize: 13, fontWeight: 800, color: BRAND_COLORS.navy }}>
          ✓ Aadhaar QR Handover
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: '10px 18px', borderRadius: 999, border: '2px solid #ADC4FA', fontSize: 13, fontWeight: 800, color: '#1E40AF' }}>
          ✓ Tamper-Proof Ledger
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: '10px 18px', borderRadius: 999, border: '2px solid #F8B4BA', fontSize: 13, fontWeight: 800, color: '#BE123C' }}>
          ✓ 1-Tap Form 6 MPR
        </div>
      </div>

      {/* Challenge & Problem Statement Badge */}
      <div
        style={{
          transform: `scale(${badgeSpring})`,
          marginTop: 26,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 24px',
            borderRadius: 999,
            backgroundColor: BRAND_COLORS.forest,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '0.06em',
            boxShadow: '0 10px 25px rgba(30, 62, 43, 0.25)',
          }}
        >
          <span>SEVA FIRST INNOVATION CHALLENGE 2026</span>
          <span style={{ color: '#E85D04' }}>·</span>
          <span>PROBLEM STATEMENT PS000052</span>
          <span style={{ color: '#E85D04' }}>·</span>
          <span>PANCHMAHAL, GUJARAT</span>
        </div>
      </div>
    </div>
  );
};
