/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ClayUI brand palette
        brand: {
          purple: '#7F77DD',
          'purple-dark': '#534AB7',
          teal: '#1D9E75',
          'teal-dark': '#0F6E56',
        },
        // Estado de equipos
        estado: {
          operativo: '#1D9E75',
          mantenimiento: '#BA7517',
          inactivo: '#888780',
          incidente: '#E24B4A',
        },
        // UI base
        clay: {
          bg: '#F8F8F6',
          card: '#FFFFFF',
          border: 'rgba(0, 0, 0, 0.08)',
          text: '#2C2C2A',
          muted: '#5F5E5A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'clay': '16px',
        'clay-sm': '10px',
        'clay-lg': '24px',
      },
      boxShadow: {
        'clay': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'clay-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'clay-lg': '0 8px 40px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'pulse-green': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
