import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneHeader } from '../components/SceneHeader';
import { GujaratiCaption } from '../components/GujaratiCaption';

export const Scene2Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneSpring = spring({ frame: frame - 10, fps, config: { damping: 14 } });

  const feature1 = spring({ frame: frame - 60, fps, config: { damping: 14 } });
  const feature2 = spring({ frame: frame - 120, fps, config: { damping: 14 } });
  const feature3 = spring({ frame: frame - 180, fps, config: { damping: 14 } });
  const feature4 = spring({ frame: frame - 240, fps, config: { damping: 14 } });

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
      {/* Left Column: Problem Statement & Solutions */}
      <div style={{ flex: 1, maxWidth: 860, zIndex: 10 }}>
        <SceneHeader
          badge="PS000052 · SEVA FIRST INNOVATION CHALLENGE 2026"
          badgeBg={BRAND_COLORS.forest}
          title="From dispatch to distribution. Every quantity accounted for."
          subtitle="Closing the 4 critical supply chain gaps across Gujarat's 53,000 Anganwadi Centres."
        />

        {/* 4 Core Pillars from Problem Statement */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 28, maxWidth: 740 }}>
          {/* Pillar 1: Paper Registers */}
          <div
            style={{
              opacity: feature1,
              transform: `translateY(${(1 - feature1) * 20}px)`,
              padding: '16px 20px',
              borderRadius: 18,
              backgroundColor: '#FFFFFF',
              border: '2px solid #FDC58A',
              boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                📋
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: BRAND_COLORS.navy }}>
                Eliminates Paper Lag
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', lineHeight: 1.4 }}>
              Replaces 13 thick physical registers with instant digital intake & live running balance.
            </div>
          </div>

          {/* Pillar 2: Beneficiary Verification Gap */}
          <div
            style={{
              opacity: feature2,
              transform: `translateY(${(1 - feature2) * 20}px)`,
              padding: '16px 20px',
              borderRadius: 18,
              backgroundColor: '#FFFFFF',
              border: '2px solid #8CEFDA',
              boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                🆔
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: BRAND_COLORS.forest }}>
                Aadhaar QR Verification
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', lineHeight: 1.4 }}>
              Direct scan of Aadhaar QR verifies genuine mothers & children, preventing ghost handovers.
            </div>
          </div>

          {/* Pillar 3: Stockouts & Spoilage */}
          <div
            style={{
              opacity: feature3,
              transform: `translateY(${(1 - feature3) * 20}px)`,
              padding: '16px 20px',
              borderRadius: 18,
              backgroundColor: '#FFFFFF',
              border: '2px solid #F8B4BA',
              boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                ⚠️
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: BRAND_COLORS.roseShortage }}>
                Zero Hidden Spoilage
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', lineHeight: 1.4 }}>
              Photo & reason-code logging for pest/moisture damage + predictive runout warning alerts.
            </div>
          </div>

          {/* Pillar 4: Manual Reporting Overhead */}
          <div
            style={{
              opacity: feature4,
              transform: `translateY(${(1 - feature4) * 20}px)`,
              padding: '16px 20px',
              borderRadius: 18,
              backgroundColor: '#FFFFFF',
              border: '2px solid #ADC4FA',
              boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                ⚡
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#1E40AF' }}>
                1-Tap Auto MPR Report
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', lineHeight: 1.4 }}>
              Compiles Form 6 Monthly Progress Reports instantly, ending laborious pre-sector meetings.
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Running Frontline Mobile App */}
      <div
        style={{
          transform: `scale(${phoneSpring}) translateY(${(1 - phoneSpring) * 60}px)`,
          zIndex: 20,
        }}
      >
        <PhoneFrame
          imageSrc="screenshots/01-dashboard.png"
          label="REAL APP · GUJARATI-FIRST FRONT-LINE DASHBOARD"
        />
      </div>

      <GujaratiCaption
        gujarati="ગુજરાતી પ્રથમ ઇન્ટરફેસ · ૫૩,૦૦૦ આંગણવાડી કેન્દ્રો માટે રચાયેલ"
        english="Gujarati-First Interface · Engineered for Frontline Workers"
      />
    </div>
  );
};
