export const BRAND_COLORS = {
  cream: '#FAF3E8',
  creamDark: '#F3EBDD',
  forest: '#1E3E2B',
  forestLight: '#2C5E43',
  orange: '#E85D04',
  navy: '#152747',
  charcoal: '#2D3748',
  white: '#FFFFFF',
  
  // Official KHORAK Pastel Palette
  pastelPink: '#F8B4BA',
  pastelPeach: '#FDC58A',
  pastelMint: '#8CEFDA',
  pastelBlue: '#ADC4FA',
  pastelYellow: '#FDEE72',
  pastelViolet: '#C1B4FA',
  pastelCyan: '#98EDE4',
  pastelLime: '#B0F090',
  pastelPurple: '#F4A9EE',
  
  // Status Colors
  roseShortage: '#E11D48',
  emeraldAccepted: '#059669',
  amberPending: '#D97706',
};

// Scene Durations in frames (30 fps)
export const SCENE_DURATIONS = {
  scene1: 450, // 15.0s (Hook - audio 13.97s + 1.03s breathing pause)
  scene2: 585, // 19.5s (Problem Statement & Solutions - audio 18.53s + 0.97s pause; fixes 30s cut)
  scene3: 570, // 19.0s (Delivery Receipt & Shortage Auditing - audio 18.12s + 0.88s pause)
  scene4: 550, // 18.33s (Aadhaar QR Scanning - audio 17.33s + 1.0s pause; eliminates 1:06-1:10 dead pause)
  scene5: 555, // 18.5s (Live Running Stock Ledger - audio 17.28s + 1.22s pause; fixes 1:28 cut)
  scene6: 525, // 17.5s (Spoilage Logging & Sector Heatmap - audio 15.70s + 1.8s pause)
  scene7: 545, // 18.17s (Offline Resilience & One-Click MPR - audio 17.09s + 1.08s pause after "generate in a single tap")
  scene8: 585, // 19.5s (Expected Outcomes & Challenge Closing - audio 16.80s + 2.7s outro)
};

export const TOTAL_FRAMES = Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0);
// 4365 frames = 145.5 seconds (2 min 25.5s)
