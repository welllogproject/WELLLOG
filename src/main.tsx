import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initTheme } from './hooks/useTheme'

initTheme()

// PWA: Service Worker se registra automáticamente via vite-plugin-pwa (registerType: 'autoUpdate')
// cleanupOutdatedCaches: true → limpia chunks viejos al activar nuevo SW

// Safety net: si un chunk dinámico falla al cargar (deploy nuevo con hashes distintos),
// limpiar cachés y recargar automáticamente UNA vez.
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message ?? ''
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk')
  ) {
    // Evitar loop infinito: solo recargar una vez
    const key = 'wlog-chunk-reload'
    const lastReload = sessionStorage.getItem(key)
    const now = Date.now()
    if (lastReload && now - Number(lastReload) < 10000) {
      // Ya recargamos hace menos de 10s — no hacer loop
      return
    }
    sessionStorage.setItem(key, String(now))

    // Limpiar cachés del SW y recargar
    if ('caches' in window) {
      caches.keys().then((keys) => {
        Promise.all(keys.map((k) => caches.delete(k))).then(() => {
          location.reload()
        })
      })
    } else {
      location.reload()
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
