import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneHeader } from '../components/SceneHeader';
import { ShortageComparison } from '../components/ShortageComparison';
import { GujaratiCaption } from '../components/GujaratiCaption';

export const Scene3Receipt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: List view, Phase 2: Dialog view
  const switchImage = frame > 180;
  const zoom = interpolate(frame, [180, 260], [1, 1.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const panY = interpolate(frame, [180, 260], [0, -80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const headerSpring = spring({ frame, fps, config: { damping: 14 } });
  const compSpring = spring({ frame: frame - 30, fps, config: { damping: 14 } });

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
      {/* Left Column: Scene Context & Verified Numbers */}
      <div style={{ flex: 1, maxWidth: 860, zIndex: 10 }}>
        <div style={{ transform: `scale(${headerSpring})` }}>
          <SceneHeader
            badge="STEP 2 · PHYSICAL DELIVERY ACCEPTANCE"
            badgeBg="#E85D04"
            title="Recording actual receipts, not assumptions."
            subtitle="Challan CH-GSCSCL-4410: Expected 100 packets Balshakti. Physical count discovers 80 received."
          />
        </div>

        <div style={{ marginTop: 28, transform: `scale(${compSpring})` }}>
          <ShortageComparison
            expected={100}
            received={80}
            shortage={20}
            commodity="Balshakti (THR 500g)"
          />
        </div>
      </div>

      {/* Right Column: Live App Delivery Screen */}
      <div style={{ transform: `scale(${headerSpring})` }}>
        <PhoneFrame
          label={switchImage ? 'REAL APP · SHORTAGE AUDITING ( ઘટ: ૨૦ )' : 'REAL APP · INTAKE VERIFICATION'}
          imageSrc={switchImage ? 'screenshots/03-receive-stock-dialog.png' : 'screenshots/02-receive-stock-list.png'}
          zoom={zoom}
          panY={panY}
          highlightBox={
            switchImage
              ? {
                  top: '38%',
                  left: '8%',
                  width: '84%',
                  height: '24%',
                  label: 'સ્વીકારેલ જથ્થો: ૮૦ • ઘટ: ૨૦',
                }
              : {
                  top: '28%',
                  left: '6%',
                  width: '88%',
                  height: '20%',
                  label: 'CH-GSCSCL-4410 (૧૦૦ પેકેટ)',
                }
          }
        />
      </div>

      <GujaratiCaption
        gujarati="ચલણ ૧૦૦ પેકેટ • સ્વીકાર ૮૦ પેકેટ • ૨૦ પેકેટની ઘટ નોંધાઈ"
        english="Challan: 100 expected → 80 accepted → 20 shortage saved"
        icon="📥"
      />
    </div>
  );
};
