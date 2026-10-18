import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';
import { BigNumberCounter } from '../components/BigNumberCounter';
import { GujaratiCaption } from '../components/GujaratiCaption';

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const boxSpring = spring({ frame, fps, config: { damping: 14 } });
  const step2Appear = spring({ frame: frame - 120, fps, config: { damping: 14 } });
  const step3Appear = spring({ frame: frame - 240, fps, config: { damping: 12, stiffness: 150 } });
  
  const impactPulse = interpolate(frame - 240, [0, 8, 16], [1, 1.15, 1], {
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Rings */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          border: '1.5px dashed rgba(30, 62, 43, 0.12)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1300,
          height: 1300,
          borderRadius: '50%',
          border: '1.5px dashed rgba(232, 93, 4, 0.08)',
          pointerEvents: 'none',
        }}
      />

      {/* Challenge Scope Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 18px',
          borderRadius: 14,
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
          marginBottom: 24,
          transform: `scale(${boxSpring})`,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 900, color: BRAND_COLORS.forest }}>
          SEVA FIRST INNOVATION CHALLENGE 2026
        </span>
        <span style={{ color: '#CBD5E1' }}>•</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: BRAND_COLORS.orange }}>
          PROBLEM STATEMENT PS000052
        </span>
      </div>

      {/* Main Narrative Question Header */}
      <h1
        style={{
          margin: 0,
          fontSize: 48,
          fontWeight: 900,
          color: BRAND_COLORS.navy,
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          maxWidth: 960,
        }}
      >
        Where do the missing nutrition packets go?
      </h1>
      <p
        style={{
          margin: '12px 0 36px 0',
          fontSize: 20,
          fontWeight: 600,
          color: '#64748B',
          textAlign: 'center',
        }}
      >
        The reality of supplementary nutrition delivery at rural Anganwadi Centres.
      </p>

      {/* 3 Step Arithmetic Cards */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          width: '100%',
          maxWidth: 1100,
          marginTop: 10,
        }}
      >
        {/* Card 1: Expected 100 */}
        <div style={{ transform: `scale(${boxSpring})` }}>
          <BigNumberCounter
            from={0}
            to={100}
            startFrame={10}
            durationFrames={40}
            label="EXPECTED ON CHALLAN"
            sublabel="ચલણ મુજબ રવાના કરેલ જથ્થો"
            color="#1E3E2B"
            borderColor="#CBD5E1"
          />
        </div>

        {/* Math Arrow 1 */}
        <div style={{ fontSize: 32, fontWeight: 900, color: '#94A3B8' }}>→</div>

        {/* Card 2: Received 80 */}
        <div style={{ opacity: step2Appear, transform: `scale(${step2Appear})` }}>
          <BigNumberCounter
            from={0}
            to={80}
            startFrame={125}
            durationFrames={40}
            label="ACTUALLY RECEIVED"
            sublabel="ખરેખર કેન્દ્ર પર પહોંચેલ જથ્થો"
            color="#059669"
            bgColor="#ECFDF5"
            borderColor="#6EE7B7"
          />
        </div>

        {/* Math Arrow 2 */}
        <div style={{ fontSize: 32, fontWeight: 900, color: '#94A3B8' }}>=</div>

        {/* Card 3: 20 Missing */}
        <div
          style={{
            opacity: step3Appear,
            transform: `scale(${step3Appear > 0 ? impactPulse : 0.8})`,
          }}
        >
          <BigNumberCounter
            from={0}
            to={20}
            startFrame={245}
            durationFrames={35}
            label="UNACCOUNTED FOR"
            sublabel="વિસંગતતા: 20 પેકેટ ખૂટે છે"
            color={BRAND_COLORS.roseShortage}
            bgColor="#FFF1F2"
            borderColor="#FDA4AF"
          />
        </div>
      </div>

      <GujaratiCaption
        gujarati="૧૦૦ પેકેટ મોકલાયા • ૮૦ પેકેટ મળ્યા • ૨૦ પેકેટની વિસંગતતા"
        english="100 packets expected on challan → 80 received → 20 missing"
        icon="⚖️"
      />
    </div>
  );
};
