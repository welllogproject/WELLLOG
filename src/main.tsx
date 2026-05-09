import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initTheme } from './hooks/useTheme'

initTheme()

// Desregistrar cualquier Service Worker existente.
// El SW anterior con CacheFirst estaba bloqueando todas las requests
// a Supabase después del F5 (servía todo desde caché con tokens vencidos).
// Una vez que tengamos dominio propio y testemos offline en campo,
// se puede reactivar con una estrategia correcta.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister()
      console.log('[WELL LOG] Service Worker desregistrado:', registration.scope)
    }
  })
  // Limpiar todos los cachés del SW
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      caches.delete(key)
      console.log('[WELL LOG] Caché eliminado:', key)
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
