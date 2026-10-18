import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface BigNumberCounterProps {
  from?: number;
  to: number;
  startFrame?: number;
  durationFrames?: number;
  label: string;
  sublabel?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  unit?: string;
}

export const BigNumberCounter: React.FC<BigNumberCounterProps> = ({
  from = 0,
  to,
  startFrame = 0,
  durationFrames = 45,
  label,
  sublabel,
  color = '#152747',
  bgColor = '#FFFFFF',
  borderColor = '#E2E8F0',
  unit = 'PACKETS',
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const currentVal = Math.round(from + (to - from) * progress);

  return (
    <div
      style={{
        backgroundColor: bgColor,
        border: `2.5px solid ${borderColor}`,
        borderRadius: 24,
        padding: '24px 32px',
        minWidth: 260,
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          color,
          lineHeight: 1,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {currentVal}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 14,
          fontWeight: 800,
          color: '#64748B',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {unit}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 16,
          fontWeight: 800,
          color,
          textAlign: 'center',
        }}
      >
        {label}
      </div>

      {sublabel && (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            fontWeight: 600,
            color: '#94A3B8',
            textAlign: 'center',
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
};
