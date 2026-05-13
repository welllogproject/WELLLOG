import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initTheme } from './hooks/useTheme'

initTheme()

// PWA: Service Worker se registra automáticamente via vite-plugin-pwa (registerType: 'autoUpdate')
// Cuando se deploya una nueva versión:
// 1. El SW detecta nuevos assets
// 2. Descarga en background
// 3. skipWaiting + clientsClaim → se activa inmediatamente
// 4. El usuario NO necesita reinstalar la PWA ni recargar manualmente
// La app funciona offline después de la primera carga (NetworkFirst para API, CacheFirst para assets)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
