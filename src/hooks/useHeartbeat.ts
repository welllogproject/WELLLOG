// src/hooks/useHeartbeat.ts
// Envía heartbeat periódico + registra eventos de sesión para monitoreo en superadmin

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

const INTERVALO_MS = 60_000 // Cada 60 segundos

// Obtener geolocalización (silencioso, no bloquea)
async function obtenerGeo(): Promise<{ lat: number; lng: number; precision: number } | null> {
  if (!navigator.geolocation) return null
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 5000)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout)
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precision: Math.round(pos.coords.accuracy),
        })
      },
      () => {
        clearTimeout(timeout)
        resolve(null)
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
    )
  })
}

export function useHeartbeat() {
  const { usuario, equipoId } = useAuthStore()
  const loginRegistrado = useRef(false)

  useEffect(() => {
    if (!usuario) {
      loginRegistrado.current = false
      return
    }

    const enviar = async (incluirGeo = false) => {
      try {
        const geo = incluirGeo ? await obtenerGeo() : null

        await supabase
          .from('dispositivos_estado')
          .upsert({
            usuario_id: usuario.id,
            equipo_id: equipoId || null,
            ultima_actividad: new Date().toISOString(),
            user_agent: navigator.userAgent.slice(0, 200),
            online: navigator.onLine,
            version_app: '1.0.0',
            ...(geo ? { latitud: geo.lat, longitud: geo.lng, precision_metros: geo.precision } : {}),
          }, { onConflict: 'usuario_id' })
      } catch {
        // Silencioso
      }
    }

    // Registrar evento de login (una sola vez por sesión)
    const registrarLogin = async () => {
      if (loginRegistrado.current) return
      loginRegistrado.current = true

      const geo = await obtenerGeo()
      try {
        await supabase.from('sesiones_log').insert({
          usuario_id: usuario.id,
          evento: 'login',
          user_agent: navigator.userAgent.slice(0, 200),
          ...(geo ? { latitud: geo.lat, longitud: geo.lng } : {}),
        })
      } catch {
        // Silencioso
      }
    }

    // Enviar heartbeat con geo al inicio, luego sin geo (para no gastar batería)
    enviar(true)
    registrarLogin()

    const interval = setInterval(() => enviar(false), INTERVALO_MS)

    // Cada 10 minutos, actualizar geo
    const geoInterval = setInterval(() => enviar(true), 10 * 60_000)

    // Detectar cambios de conectividad
    const handleOnline = () => enviar(true)
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
      clearInterval(geoInterval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [usuario?.id, equipoId])
}

// Registrar logout explícito (llamar desde useAuth.logout)
export async function registrarLogout(usuarioId: string) {
  try {
    await supabase.from('sesiones_log').insert({
      usuario_id: usuarioId,
      evento: 'logout',
      user_agent: navigator.userAgent.slice(0, 200),
    })
  } catch {
    // Silencioso
  }
}
