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
          DEFAULT: '#FFF8EC',
          light: '#FFFDF9',
          dark: '#F7EED8',
        },
        kumkum: {
          DEFAULT: '#C2185B',
          dark: '#880E4F',
          light: '#FCE4EC',
          50: '#FDF2F5',
          100: '#FCE4EC',
          200: '#F8BBD0',
          500: '#E91E63',
          600: '#D81B60',
          700: '#C2185B',
          800: '#AD1457',
          900: '#880E4F',
        },
        turmeric: {
          DEFAULT: '#FFB300',
          dark: '#FF8F00',
          light: '#FFF8E1',
          50: '#FFFDE7',
          100: '#FFF9C4',
          400: '#FFCA28',
          500: '#FFB300',
          600: '#FB8C00',
          700: '#F57C00',
        },
        leafGreen: {
          DEFAULT: '#2E7D32',
          dark: '#1B5E20',
          light: '#E8F5E9',
          50: '#F1F8E9',
          100: '#DCEDC8',
          600: '#388E3C',
          700: '#2E7D32',
          800: '#1B5E20',
        },
        warmBrown: {
          DEFAULT: '#3E2723',
          muted: '#5D4037',
          subtle: '#8D6E63',
          light: '#D7CCC8',
          50: '#EFEBE9',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Noto Sans Tamil', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'Poppins', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        'warm-sm': '0 2px 8px -2px rgba(62, 39, 35, 0.06), 0 1px 4px -1px rgba(62, 39, 35, 0.04)',
        'warm-md': '0 8px 24px -4px rgba(62, 39, 35, 0.08), 0 4px 12px -2px rgba(62, 39, 35, 0.04)',
        'warm-lg': '0 16px 36px -6px rgba(62, 39, 35, 0.12), 0 8px 16px -4px rgba(62, 39, 35, 0.06)',
        'kumkum-glow': '0 0 24px rgba(194, 24, 91, 0.25)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
        'fade-in': 'fade-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};

