/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFDF9',
          100: '#FAF3E8',
          200: '#F5EADB',
          300: '#EBD9C1',
        },
        brand: {
          orange: '#C87816',
          orangeLight: '#E68A1B',
          navy: '#152747',
          mintPill: '#D6F5EC',
          mintPillText: '#1A6753',
        },
        pastel: {
          // Tile 1: Stock Receive
          pink: '#FCE5E7',
          pinkHover: '#FAD2D5',
          pinkIcon: '#D93845',
          
          // Tile 2: THR Distribution
          peach: '#FEEBD0',
          peachHover: '#FEDEBA',
          peachIcon: '#B86E18',
          
          // Tile 3: Hot Cooked Meals
          cyan: '#CEF6F2',
          cyanHover: '#B8F3ED',
          cyanIcon: '#0D9488',
          
          // Tile 4: Stock Balance
          blue: '#D8E2FD',
          blueHover: '#C6D5FC',
          blueIcon: '#2563EB',
          
          // Tile 5: Stock Ledger
          yellow: '#FFF7B8',
          yellowHover: '#FEF39D',
          yellowIcon: '#D97706',
          
          // Tile 6: Physical Count
          lime: '#D7F7C7',
          limeHover: '#C7F3B0',
          limeIcon: '#16A34A',
          
          // Tile 7: Spoilage / Damage
          purple: '#FBDDF8',
          purpleHover: '#F8C8F4',
          purpleIcon: '#9333EA',
          
          // Tile 8: Reports & MPR
          mint: '#BEF8EE',
          mintHover: '#A8F5E7',
          mintIcon: '#0D9488',
          
          // Tile 9: Sync Centre
          violet: '#E2DDFD',
          violetHover: '#D3CAFC',
          violetIcon: '#6366F1',
        },
        forest: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#2D6A4F',
          800: '#1B4332',
          900: '#081C15',
        },
        saffron: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Shruti',
          'Gujarati Sangam MN',
          'Nirmala UI',
          'sans-serif'
        ],
        gujarati: [
          'Shruti',
          'Gujarati Sangam MN',
          'Nirmala UI',
          'Noto Sans Gujarati',
          'sans-serif'
        ]
      },
      boxShadow: {
        'tile': '0 2px 6px -1px rgba(0, 0, 0, 0.04), 0 1px 3px -1px rgba(0, 0, 0, 0.02)',
        'tile-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
