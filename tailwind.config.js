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
          DEFAULT: '#39ff14',
          glow: 'rgba(57, 255, 20, 0.35)',
          dark: '#2cc90e'
        },
        cyan: {
          neon: '#00f2fe',
          glow: 'rgba(0, 242, 254, 0.35)',
          deep: '#4facfe'
        },
        amber: {
          neon: '#ffb300',
          glow: 'rgba(255, 179, 0, 0.35)'
        }
      },
      boxShadow: {
        'neon': '0 0 25px rgba(57, 255, 20, 0.45)',
        'neon-lg': '0 0 45px rgba(57, 255, 20, 0.65)',
        'cyan-glow': '0 0 25px rgba(0, 242, 254, 0.45)',
        'amber-glow': '0 0 25px rgba(255, 179, 0, 0.45)',
        'card-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.85', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}