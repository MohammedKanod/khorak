import React from 'react';
import { Img, staticFile } from 'remotion';

export interface PhoneFrameProps {
  imageSrc: string;
  zoom?: number;
  panY?: number;
  panX?: number;
  label?: string;
  highlightBox?: {
    top: string;
    left: string;
    width: string;
    height: string;
    label?: string;
  };
  highlightRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  };
  style?: React.CSSProperties;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  imageSrc,
  zoom = 1,
  panY = 0,
  panX = 0,
  label,
  highlightBox,
  highlightRect,
  style,
}) => {
  // Convert highlightRect to percentages if provided (based on baseline 380x780 dimensions)
  const effectiveBox = highlightBox || (highlightRect ? {
    left: `${(highlightRect.x / 380) * 100}%`,
    top: `${(highlightRect.y / 780) * 100}%`,
    width: `${(highlightRect.width / 380) * 100}%`,
    height: `${(highlightRect.height / 780) * 100}%`,
    label: highlightRect.label,
  } : undefined);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Optional Top Floating Source Badge */}
      {label && (
        <div
          style={{
            position: 'absolute',
            top: -42,
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            backgroundColor: '#1E3E2B',
            color: '#8CEFDA',
            padding: '7px 18px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            boxShadow: '0 8px 24px rgba(30, 62, 43, 0.28)',
            border: '1.5px solid rgba(140, 239, 218, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 40,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#8CEFDA',
              boxShadow: '0 0 10px #8CEFDA',
            }}
          />
          {label}
        </div>
      )}

      {/* Main Flagship Phone Body */}
      <div
        style={{
          position: 'relative',
          width: 420,
          height: 860,
          borderRadius: 52,
          padding: 11,
          backgroundColor: '#0F1216',
          backgroundImage: 'linear-gradient(145deg, #2D333B 0%, #15181E 40%, #0D0F12 100%)',
          boxShadow: `
            0 35px 85px -15px rgba(21, 39, 71, 0.45),
            0 15px 35px -10px rgba(0, 0, 0, 0.35),
            0 0 0 1px rgba(255, 255, 255, 0.12),
            0 0 0 3px #1F242C,
            0 0 0 7px #0A0C0E
          `,
          display: 'flex',
          flexDirection: 'column',
          ...style,
        }}
      >
        {/* Hardware Side Buttons */}
        {/* Left Side: Volume Up */}
        <div
          style={{
            position: 'absolute',
            left: -8,
            top: 155,
            width: 5,
            height: 52,
            backgroundColor: '#373E47',
            borderRadius: '3px 0 0 3px',
            boxShadow: '-1px 0 3px rgba(0,0,0,0.4)',
          }}
        />
        {/* Left Side: Volume Down */}
        <div
          style={{
            position: 'absolute',
            left: -8,
            top: 220,
            width: 5,
            height: 52,
            backgroundColor: '#373E47',
            borderRadius: '3px 0 0 3px',
            boxShadow: '-1px 0 3px rgba(0,0,0,0.4)',
          }}
        />
        {/* Right Side: Power Button */}
        <div
          style={{
            position: 'absolute',
            right: -8,
            top: 185,
            width: 5,
            height: 78,
            backgroundColor: '#373E47',
            borderRadius: '0 3px 3px 0',
            boxShadow: '1px 0 3px rgba(0,0,0,0.4)',
          }}
        />

        {/* Dynamic Island Pill */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 114,
            height: 27,
            backgroundColor: '#000000',
            borderRadius: 20,
            zIndex: 35,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {/* Front Camera Lens with antireflective reflection */}
          <div
            style={{
              width: 11,
              height: 11,
              borderRadius: '50%',
              backgroundColor: '#0B132B',
              border: '1.5px solid #1C2541',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 1,
                right: 1,
                width: 3,
                height: 3,
                borderRadius: '50%',
                backgroundColor: '#3A86FF',
                opacity: 0.8,
              }}
            />
          </div>
          {/* Proximity / Sensor Dot */}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#06130B',
              border: '1px solid #0F2D1A',
            }}
          />
        </div>

        {/* Screen Area */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: 43,
            overflow: 'hidden',
            backgroundColor: '#FAF3E8',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
          }}
        >
          {/* Scaled/Panned Image Container */}
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
          >
            <Img
              src={staticFile(imageSrc)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
              }}
            />
          </div>

          {/* Premium Diagonal Glass Glare */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 28%, transparent 50%)',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          />

          {/* Bottom Home Indicator Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 136,
              height: 4.5,
              borderRadius: 3,
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              zIndex: 30,
              pointerEvents: 'none',
            }}
          />

          {/* Highlight Callout Box */}
          {effectiveBox && (
            <div
              style={{
                position: 'absolute',
                top: effectiveBox.top,
                left: effectiveBox.left,
                width: effectiveBox.width,
                height: effectiveBox.height,
                border: '3px solid #E85D04',
                borderRadius: 16,
                boxShadow:
                  '0 0 24px rgba(232, 93, 4, 0.45), inset 0 0 18px rgba(232, 93, 4, 0.25)',
                pointerEvents: 'none',
                zIndex: 25,
              }}
            >
              {effectiveBox.label && (
                <div
                  style={{
                    position: 'absolute',
                    top: -28,
                    left: 10,
                    backgroundColor: '#E85D04',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '3px 10px',
                    borderRadius: 8,
                    letterSpacing: '0.04em',
                    boxShadow: '0 4px 12px rgba(232, 93, 4, 0.35)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {effectiveBox.label}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
