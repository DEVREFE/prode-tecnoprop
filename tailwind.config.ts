import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        celeste: '#36A9E0',
        azul: '#1D70B7',
        gold: '#FFB800',
        'bg-0': '#050c18',
        'bg-1': '#071121',
        'bg-2': '#0d1a2e',
        'bg-3': '#122035',
        glass: 'rgba(255,255,255,0.04)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #36A9E0, #1D70B7)',
        'gradient-ambient-top': 'radial-gradient(ellipse at top left, rgba(29,112,183,0.18) 0%, transparent 70%)',
        'gradient-ambient-bottom': 'radial-gradient(ellipse at bottom right, rgba(54,169,224,0.12) 0%, transparent 70%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
        'count-up': 'fadeUp 0.4s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderColor: {
        glass: 'rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [forms],
}

export default config
