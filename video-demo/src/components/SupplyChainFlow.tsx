import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { BRAND_COLORS } from '../types';

interface SupplyChainFlowProps {
  activeStep?: number; // 1 to 5
  style?: React.CSSProperties;
}

export const SupplyChainFlow: React.FC<SupplyChainFlowProps> = ({
  activeStep = 1,
  style,
}) => {
  const frame = useCurrentFrame();

  const steps = [
    { num: 1, title: 'DISPATCH', sub: 'સપ્લાય રવાના', icon: '🚚' },
    { num: 2, title: 'RECEIPT', sub: 'સ્ટોક મેળવો', icon: '📦' },
    { num: 3, title: 'STOCK', sub: 'ચોખ્ખો જથ્થો', icon: '📊' },
    { num: 4, title: 'DISTRIBUTION', sub: 'લાભાર્થી વિતરણ', icon: '🤝' },
    { num: 5, title: 'AUDIT', sub: 'ઓડિટ અને સમીક્ષા', icon: '🛡️' },
  ];

  const pulse = interpolate(frame % 30, [0, 15, 30], [1, 1.08, 1]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 1040,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: '20px 28px',
        border: '2px solid #E2E8F0',
        boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
        ...style,
      }}
    >
      {steps.map((s, idx) => {
        const isActive = s.num === activeStep;
        const isPast = s.num < activeStep;

        return (
          <React.Fragment key={s.num}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: `scale(${isActive ? pulse : 1})`,
                transition: 'transform 0.2s',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: isActive
                    ? BRAND_COLORS.orange
                    : isPast
                    ? '#059669'
                    : '#F1F5F9',
                  color: isActive || isPast ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 900,
                  boxShadow: isActive
                    ? '0 8px 20px rgba(232, 93, 4, 0.4)'
                    : isPast
                    ? '0 4px 12px rgba(5, 150, 105, 0.25)'
                    : 'none',
                }}
              >
                {isPast ? '✓' : s.icon}
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  fontWeight: 900,
                  color: isActive ? BRAND_COLORS.orange : isPast ? '#059669' : '#64748B',
                  letterSpacing: '0.05em',
                }}
              >
                {s.title}
              </div>

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#94A3B8',
                  marginTop: 2,
                }}
              >
                {s.sub}
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 4,
                  backgroundColor: isPast ? '#10B981' : '#E2E8F0',
                  margin: '0 12px',
                  borderRadius: 4,
                  marginTop: -22,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
