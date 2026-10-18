import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_COLORS } from '../types';

interface SceneHeaderProps {
  badge: string;
  badgeBg?: string;
  badgeColor?: string;
  title: string;
  subtitle?: string;
  style?: React.CSSProperties;
}

export const SceneHeader: React.FC<SceneHeaderProps> = ({
  badge,
  badgeBg = '#1E3E2B',
  badgeColor = '#FFFFFF',
  title,
  subtitle,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        opacity,
        transform: `translateY(${(1 - entrance) * 20}px)`,
        ...style,
      }}
    >
      {/* Category / Scope Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 12,
          backgroundColor: badgeBg,
          color: badgeColor,
          fontSize: 13,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <span>{badge}</span>
      </div>

      {/* Main Headline */}
      <h1
        style={{
          margin: 0,
          fontSize: 44,
          fontWeight: 900,
          color: BRAND_COLORS.navy,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {title}
      </h1>

      {/* Supporting Subtitle */}
      {subtitle && (
        <p
          style={{
            margin: '10px 0 0 0',
            fontSize: 20,
            fontWeight: 600,
            color: '#4B5563',
            maxWidth: 620,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
