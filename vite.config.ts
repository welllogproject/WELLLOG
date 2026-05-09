import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // Genera el SW automáticamente — no hay que mantener sw.js a mano
      registerType: 'autoUpdate',

      // Incluir todos los assets del build en el precache
      includeAssets: ['favicon.svg', 'icons/*.png'],

      // Manifest de la PWA
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

      workbox: {
        // ── Estrategia de caché ──────────────────────────────────
        //
        // PROBLEMA DE CAMPO: la tablet puede estar días sin internet.
        // Necesitamos que TODO funcione offline desde el primer uso.
        //
        // Estrategia:
        //   - App shell (HTML/JS/CSS): CacheFirst — siempre sirve desde caché,
        //     actualiza en background cuando hay conexión
        //   - Supabase API: NetworkFirst con fallback — intenta red, si falla
        //     sirve desde caché (datos del último fetch)
        //   - Tiles de OpenStreetMap: CacheFirst con límite de 500 tiles
        //     (los mapas de la zona quedan cacheados después del primer uso)

        // Precachear todos los assets del build (JS, CSS, HTML)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Rutas que van a NetworkFirst (datos en tiempo real)
        runtimeCaching: [
          // Supabase REST API — NetworkFirst: intenta red, fallback a caché
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // Supabase Auth — NetworkFirst (sesión siempre fresca si hay red)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-auth',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 hora
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // Tiles de OpenStreetMap — CacheFirst (mapa disponible offline)
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 500,   // ~500 tiles cubre bien una zona de campo
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // Leaflet icons desde unpkg — CacheFirst
          {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'leaflet-assets',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],

        // Skipear el waiting — actualiza el SW inmediatamente
        skipWaiting: true,
        clientsClaim: true,
      },
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
