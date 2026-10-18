import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneHeader } from '../components/SceneHeader';
import { GujaratiCaption } from '../components/GujaratiCaption';

export const Scene6Offline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Network state animation:
  // Frames 0-120: Offline (Red)
  // Frames 120-220: Reconnecting (Amber)
  // Frames 220+: Synced (Green)
  const isOnline = frame > 120;
  const isSynced = frame > 220;

  const statusColor = isSynced ? '#059669' : isOnline ? '#D97706' : '#DC2626';
  const statusBg = isSynced ? '#ECFDF5' : isOnline ? '#FEF3C7' : '#FEF2F2';
  const statusText = isSynced
    ? 'ONLINE · ALL CHANGES SYNCED'
    : isOnline
    ? 'CONNECTIVITY RESTORED · SYNCING...'
    : 'OFFLINE MODE · STORED LOCALLY';

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
      {/* Left Column: Offline Architecture Explanation */}
      <div style={{ flex: 1, maxWidth: 860, zIndex: 10 }}>
        <SceneHeader
          badge="RESILIENT ENGINEERING · OFFLINE FIRST"
          badgeBg="#1E3E2B"
          title="Designed for zero connectivity in remote hamlets."
          subtitle="Anganwadi workers cannot wait for 4G signals. Transactions are committed instantly to client storage and synchronized safely."
        />

        {/* Live Network Status Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 24,
            padding: '12px 20px',
            borderRadius: 16,
            backgroundColor: statusBg,
            border: `2px solid ${statusColor}`,
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: statusColor,
              boxShadow: `0 0 10px ${statusColor}`,
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 900, color: statusColor, letterSpacing: '0.04em' }}>
            {statusText}
          </span>
        </div>

        {/* 3 Step Sequence Card */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 24,
            maxWidth: 620,
          }}
        >
          {/* Step 1 */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: '18px 16px',
              border: '2px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 24 }}>💾</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: BRAND_COLORS.navy, marginTop: 8 }}>
              SAVED ON DEVICE
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginTop: 2 }}>
              સ્થાનિક મેમરી સંગ્રહ
            </div>
          </div>

          <div style={{ alignSelf: 'center', fontSize: 20, fontWeight: 900, color: '#94A3B8' }}>→</div>

          {/* Step 2 */}
          <div
            style={{
              flex: 1,
              backgroundColor: isOnline ? '#FFFBEB' : '#FFFFFF',
              borderRadius: 18,
              padding: '18px 16px',
              border: `2px solid ${isOnline ? '#FDE68A' : '#E2E8F0'}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 24 }}>📤</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: BRAND_COLORS.navy, marginTop: 8 }}>
              OUTBOX QUEUE
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginTop: 2 }}>
              સિંક કતારમાં જમા
            </div>
          </div>

          <div style={{ alignSelf: 'center', fontSize: 20, fontWeight: 900, color: '#94A3B8' }}>→</div>

          {/* Step 3 */}
          <div
            style={{
              flex: 1,
              backgroundColor: isSynced ? '#ECFDF5' : '#FFFFFF',
              borderRadius: 18,
              padding: '18px 16px',
              border: `2px solid ${isSynced ? '#6EE7B7' : '#E2E8F0'}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 24 }}>☁️</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: isSynced ? '#047857' : BRAND_COLORS.navy, marginTop: 8 }}>
              AUTO SYNCED
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: isSynced ? '#059669' : '#64748B', marginTop: 2 }}>
              સંપૂર્ણ સમન્વય પૂર્ણ
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Sync Centre Screenshot */}
      <div style={{ marginRight: 40 }}>
        <PhoneFrame
          imageSrc="screenshots/06-sync-centre.png"
          highlightBox={{
            top: '24%',
            left: '6%',
            width: '88%',
            height: '24%',
            label: 'સિંક કેન્દ્ર · ડેટા મોકલો',
          }}
        />
      </div>

      <GujaratiCaption
        gujarati="ઓફલાઇન કામગીરી • ઇન્ટરનેટ વિના પણ વિતરણ નોંધણી • આપોઆપ સિંક"
        english="True offline-first: Frontline workers can record stock and distributions anywhere"
        icon="⚡"
      />
    </div>
  );
};
