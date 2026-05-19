/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          dark:    '#3730a3',
          light:   '#6366f1',
        },
        accent: '#f43f5e',
        brand: {
          bg:     '#f8fafc',
          card:   'rgba(255,255,255,0.82)',
          border: 'rgba(15,23,42,0.07)',
          input:  'rgba(248,250,252,0.95)',
        },
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(15,23,42,0.06), 0 2px 4px -2px rgba(15,23,42,0.04)',
        cardHover: '0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.06)',
        primary: '0 4px 14px -1px rgba(79,70,229,0.3)',
      },
      backdropBlur: { card: '16px' },
      borderRadius: { card: '20px', btn: '12px' },
      animation: {
        'slide-down': 'slideDown 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':    'fadeIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'pop-in':     'popIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'sweep':      'sweepLine 2.5s ease-in-out infinite',
        'pulse-node': 'pulseNode 1.2s infinite',
        'flow-line':  'flowLine 2s linear infinite',
      },
      keyframes: {
        slideDown: {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        sweepLine: {
          '0%':   { top: '0%',   opacity: '0.1' },
          '15%':  { opacity: '1' },
          '85%':  { opacity: '1' },
          '100%': { top: '100%', opacity: '0.1' },
        },
        pulseNode: {
          '0%':   { transform: 'scale(1)',    boxShadow: '0 0 8px rgba(99,102,241,0.3)' },
          '50%':  { transform: 'scale(1.25)', boxShadow: '0 0 20px #f43f5e', background: '#f43f5e' },
          '100%': { transform: 'scale(1)',    boxShadow: '0 0 8px rgba(99,102,241,0.3)' },
        },
        flowLine: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
