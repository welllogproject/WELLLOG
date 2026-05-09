import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],

      manifest: {
        name: 'WELL LOG',
        short_name: 'WELL LOG',
        description: 'Control de acceso digital para yacimientos petroleros',
        start_url: '/',
        display: 'standalone',
        background_color: '#F4F4F2',
        theme_color: '#7F77DD',
        orientation: 'portrait-primary',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },

      // Service Worker deshabilitado temporalmente.
      // El SW con CacheFirst estaba sirviendo toda la app desde caché
      // después del F5, bloqueando las requests a Supabase (solo 1 request
      // visible en la pestaña Red = todo viene del caché).
      // Se reactiva cuando tengamos dominio propio y podamos testear
      // el comportamiento offline en campo con la tablet real.
      workbox: {
        globPatterns: [],
        runtimeCaching: [],
        skipWaiting: false,
        clientsClaim: false,
        navigateFallback: undefined,
      },
      // No registrar el SW en el cliente
      injectRegister: null,
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    open: true,
  },

  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-data':   ['@supabase/supabase-js', '@tanstack/react-query', 'zustand'],
          'vendor-map':    ['leaflet', 'react-leaflet'],
          'vendor-charts': ['recharts'],
          'vendor-xlsx':   ['xlsx'],
          'vendor-utils':  ['date-fns', 'react-hot-toast', 'lucide-react'],
        },
      },
    },
  },
})
