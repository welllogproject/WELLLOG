import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
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
    // Aumentar el límite de advertencia de chunk (las librerías de mapas son grandes)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — cambia poco, se cachea bien
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase + TanStack Query — cambian poco
          'vendor-data': ['@supabase/supabase-js', '@tanstack/react-query', 'zustand'],
          // Leaflet — pesado, lazy-loadeable
          'vendor-map': ['leaflet', 'react-leaflet'],
          // Recharts — pesado, solo en vistas de estadísticas
          'vendor-charts': ['recharts'],
          // xlsx — solo se usa al exportar
          'vendor-xlsx': ['xlsx'],
          // Utilidades pequeñas
          'vendor-utils': ['date-fns', 'react-hot-toast', 'lucide-react'],
        },
      },
    },
  },
})
