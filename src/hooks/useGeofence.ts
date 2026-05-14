// src/hooks/useGeofence.ts
// Verifica si la tablet está dentro del radio del equipo asignado
// Alerta si está demasiado lejos (posible uso indebido)

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useEquipo } from '@/hooks/useEquipos'
import { parseGeoPoint } from '@/lib/geo'

const WARN_DISTANCE_KM = Number(import.meta.env.VITE_GEOFENCE_WARN_DISTANCE_KM || 2)
const ENABLED = import.meta.env.VITE_FEATURE_GEOFENCE === 'true'

interface GeofenceState {
  dentroDeZona: boolean | null // null = no se pudo determinar
  distanciaKm: number | null
  alerta: string | null
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function useGeofence(): GeofenceState {
  const { equipoId } = useAuthStore()
  const { data: equipo } = useEquipo(equipoId)
  const [state, setState] = useState<GeofenceState>({
    dentroDeZona: null,
    distanciaKm: null,
    alerta: null,
  })

  useEffect(() => {
    if (!ENABLED || !equipo) return

    const coordsEquipo = parseGeoPoint(equipo.ubicacion_punto)
    if (!coordsEquipo) {
      setState({ dentroDeZona: null, distanciaKm: null, alerta: null })
      return
    }

    if (!navigator.geolocation) {
      setState({ dentroDeZona: null, distanciaKm: null, alerta: 'GPS no disponible' })
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const dist = haversineKm(
          pos.coords.latitude, pos.coords.longitude,
          coordsEquipo[0], coordsEquipo[1]
        )
        const dentro = dist <= WARN_DISTANCE_KM
        setState({
          dentroDeZona: dentro,
          distanciaKm: Math.round(dist * 10) / 10,
          alerta: dentro ? null : `Estás a ${dist.toFixed(1)} km del equipo (máximo ${WARN_DISTANCE_KM} km)`,
        })
      },
      () => {
        setState({ dentroDeZona: null, distanciaKm: null, alerta: 'No se pudo obtener ubicación' })
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [equipo?.id])

  if (!ENABLED) return { dentroDeZona: null, distanciaKm: null, alerta: null }
  return state
}
