/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        // Brand accent
        accent: {
          DEFAULT: '#5b7fff',
          light: '#3a5cf5',
          muted: 'rgba(91,127,255,0.10)',
        },
        // Status colors
        status: {
          available: '#22c55e',
          occupied:  '#f59e0b',
          maintenance: '#f43f5e',
        },
        // Condition colors
        cond: {
          good:    '#22c55e',
          lagging: '#f59e0b',
          repair:  '#f97316',
          damaged: '#f43f5e',
        },
        // Dark surface palette
        dark: {
          bg:         '#0c0f18',
          surface:    '#141824',
          surfaceAlt: '#1a2030',
          border:     '#232b3e',
          borderSub:  '#181f30',
          mapBg:      '#0f1320',
          rowBg:      '#1a2030',
          rowBorder:  '#252f45',
          serverBg:   '#141e2e',
        },
      },
      animation: {
        'live-pulse': 'livePulse 2.2s ease-in-out infinite',
        'fade-in':    'fadeIn .22s ease',
      },
      keyframes: {
        livePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(5px)' },
          to:   { opacity: '1', transform: 'none' },
        },
      },
    },
  },
  plugins: [],
}
