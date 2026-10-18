import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { BRAND_COLORS } from '../types';

interface GujaratiCaptionProps {
  gujarati: string;
  english: string;
  icon?: string;
  style?: React.CSSProperties;
}

export const GujaratiCaption: React.FC<GujaratiCaptionProps> = ({
  gujarati,
  english,
  icon = '✨',
  style,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const slideY = interpolate(frame, [0, 12], [15, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: `translateX(-50%) translateY(${slideY}px)`,
        opacity,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        backgroundColor: 'rgba(21, 39, 71, 0.94)',
        backdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(255, 255, 255, 0.18)',
        borderRadius: 20,
        padding: '14px 28px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
        zIndex: 50,
        ...style,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: 'rgba(232, 93, 4, 0.25)',
          border: '1px solid rgba(232, 93, 4, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}
      >
        {icon}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '0.01em',
            fontFamily: "'Noto Sans Gujarati', sans-serif, system-ui",
          }}
        >
          {gujarati}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#CBD5E1',
            marginTop: 2,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {english}
        </div>
      </div>
    </div>
  );
};
