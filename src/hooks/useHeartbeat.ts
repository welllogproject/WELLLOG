// src/hooks/useHeartbeat.ts
// Envía un "heartbeat" periódico para que el superadmin sepa que la tablet está activa

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

const INTERVALO_MS = 60_000 // Cada 60 segundos

export function useHeartbeat() {
  const { usuario, equipoId } = useAuthStore()

  useEffect(() => {
    if (!usuario) return

    const enviar = async () => {
      try {
        await supabase
          .from('dispositivos_estado')
          .upsert({
            usuario_id: usuario.id,
            equipo_id: equipoId || null,
            ultima_actividad: new Date().toISOString(),
            user_agent: navigator.userAgent.slice(0, 200),
            online: navigator.onLine,
            version_app: document.querySelector('meta[name="version"]')?.getAttribute('content') || '1.0.0',
          }, { onConflict: 'usuario_id' })
      } catch {
        // Silencioso — no bloquear la app si falla
      }
    }

    // Enviar inmediatamente al montar
    enviar()

    // Enviar periódicamente
    const interval = setInterval(enviar, INTERVALO_MS)

    // Detectar cambios de conectividad
    const handleOnline = () => enviar()
    const handleOffline = async () => {
      try {
        await supabase
          .from('dispositivos_estado')
          .upsert({
            usuario_id: usuario.id,
            equipo_id: equipoId || null,
            ultima_actividad: new Date().toISOString(),
            online: false,
          }, { onConflict: 'usuario_id' })
      } catch { /* silencioso */ }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [usuario?.id, equipoId])
}
