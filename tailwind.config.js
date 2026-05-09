/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#7F77DD',
          'purple-dark': '#534AB7',
          teal: '#1D9E75',
          'teal-dark': '#0F6E56',
        },
        estado: {
          operativo: '#1D9E75',
          mantenimiento: '#BA7517',
          inactivo: '#888780',
          incidente: '#E24B4A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'clay':    '16px',
        'clay-sm': '10px',
        'clay-lg': '24px',
      },
      boxShadow: {
        'clay':    '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'clay-sm': '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        'clay-lg': '0 4px 24px rgba(0,0,0,0.10), 0 8px 40px rgba(0,0,0,0.08)',
      },
      scale: {
        '98': '0.98',  // active:scale-98 — feedback táctil en botones
      },
      animation: {
        'slide-up':  'slideUp 0.2s ease-out',
        'fade-in':   'fadeIn 0.15s ease-out',
        'scale-in':  'scaleIn 0.15s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
