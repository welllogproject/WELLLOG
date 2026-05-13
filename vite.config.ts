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

      // PWA con Service Worker habilitado:
      // - Precache: HTML, CSS, JS (la app carga sin internet)
      // - Runtime: NetworkFirst para Supabase API (intenta red, fallback caché)
      //           CacheFirst para tiles de mapa (500 tiles, 30 días)
      // - autoUpdate: cuando se deploya nueva versión, el SW se actualiza solo
      //   El usuario NO necesita reinstalar la PWA — Chrome actualiza automáticamente
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        // Limpiar cachés viejas al activar nuevo SW
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Supabase API — NetworkFirst (intenta red, si falla usa caché)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60, // 1 hora máximo en caché
              },
              networkTimeoutSeconds: 5, // Si no responde en 5s, usar caché
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Tiles de OpenStreetMap — CacheFirst (se guardan para offline)
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Google Fonts — CacheFirst
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
            },
          },
        ],
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
