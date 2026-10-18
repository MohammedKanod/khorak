import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneHeader } from '../components/SceneHeader';
import { SupplyChainFlow } from '../components/SupplyChainFlow';
import { GujaratiCaption } from '../components/GujaratiCaption';

export const Scene7Reports: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Active step progresses along the pipeline across the scene
  const activeStep = Math.min(5, Math.max(1, Math.floor(frame / 75) + 1));

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
      {/* Left Column: Traceability & Flow Pipeline */}
      <div style={{ flex: 1, maxWidth: 860, zIndex: 10 }}>
        <SceneHeader
          badge="END-TO-END TRACEABILITY · CAG COMPLIANCE"
          badgeBg={BRAND_COLORS.navy}
          title="One transparent chain. No unrecorded leaks."
          subtitle="From supplier dispatch to mother and child handover. Every receipt, balance, distribution, and shortage forms an auditable digital trail."
        />

        {/* 5-Step Pipeline Flow */}
        <div style={{ marginTop: 32 }}>
          <SupplyChainFlow activeStep={activeStep} />
        </div>

        {/* Key Outcomes Summary Card */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 24,
            maxWidth: 620,
          }}
        >
          <div
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: '16px 20px',
              border: '1.5px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
              MONTHLY PROGRESS
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: BRAND_COLORS.forest, marginTop: 4 }}>
              Automated MPR Reports
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginTop: 2 }}>
              કાગળિયા રજિસ્ટર ભરવાનો સમય ૯૦% ઘટે છે
            </div>
          </div>

          <div
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: '16px 20px',
              border: '1.5px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
              RECONCILIATION
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: BRAND_COLORS.orange, marginTop: 4 }}>
              Real-Time Stock Audit
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginTop: 2 }}>
              તાલુકા અને જિલ્લા સ્તરે સીધો ડેટા
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Reports Screen */}
      <div style={{ marginRight: 40 }}>
        <PhoneFrame
          imageSrc="screenshots/08-reports-mpr.png"
          highlightBox={{
            top: '20%',
            left: '6%',
            width: '88%',
            height: '24%',
            label: 'માસિક પ્રગતિ અહેવાલ (MPR)',
          }}
        />
      </div>

      <GujaratiCaption
        gujarati="સંપૂર્ણ પારદર્શક પુરવઠા શૃંખલા • રવાનાથી લઈને વિતરણ સુધી"
        english="Complete supply chain traceability: Dispatch → Receipt → Stock → Distribution → Audit"
        icon="📜"
      />
    </div>
  );
};
