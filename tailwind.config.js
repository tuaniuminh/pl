/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        oled: '#000000',
        darkCard: '#0d0f12',
        darkCardHover: '#14171d',
        darkBorder: '#1e232d',
        neon: {
          DEFAULT: '#10b981', // Xanh Ngọc Lục Bảo dịu mắt
          mint: '#34d399',    // Xanh Bạc Hà tươi mát
          glow: 'rgba(16, 185, 129, 0.22)',
          dark: '#059669'
        },
        cyan: {
          neon: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.22)',
          deep: '#0891b2'
        },
        amber: {
          neon: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.22)'
        }
      },
      boxShadow: {
        'neon': '0 4px 16px rgba(16, 185, 129, 0.25)',
        'neon-lg': '0 6px 24px rgba(16, 185, 129, 0.35)',
        'cyan-glow': '0 4px 16px rgba(6, 182, 212, 0.25)',
        'amber-glow': '0 4px 16px rgba(245, 158, 11, 0.25)',
        'card-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.88', transform: 'scale(1.01)' },
        }
      }
    },
  },
  plugins: [],
}