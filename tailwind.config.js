/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        touch: { raw: '(hover: none)' },
      },
      colors: {
        ivory: '#F6F1E7',
        cream: '#FBF7EF',
        night: '#1A120C',
        chocolate: '#2D2118',
        maroon: { DEFAULT: '#6B1F2A', dark: '#511621' },
        gold: { light: '#E6C97E', DEFAULT: '#C8A24B', dark: '#8C6A2B' },
        walnut: '#4A3525',
        ink: '#2A1F17',
        muted: '#6B625A',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        lux: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0.45)' },
          '70%': { boxShadow: '0 0 0 14px rgba(37, 211, 102, 0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        kenburns: {
          from: { transform: 'scale(1)' },
          to: { transform: 'scale(1.09)' },
        },
        'thread-drop': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '35%': { opacity: '1' },
          '100%': { transform: 'translateY(34px)', opacity: '0' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.6s ease-out infinite',
        marquee: 'marquee 34s linear infinite',
        kenburns: 'kenburns 10s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'thread-drop': 'thread-drop 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
