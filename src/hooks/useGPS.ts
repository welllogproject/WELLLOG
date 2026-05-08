// src/hooks/useGPS.ts
// Captura GPS silenciosa — nunca bloquea el flujo si falla

import { useState, useCallback } from 'react'

export interface GPSPosition {
  lat: number
  lng: number
  precision: number
}

export function useGPS() {
  const [position, setPosition] = useState<GPSPosition | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const capturar = useCallback((): Promise<GPSPosition | null> => {
    if (!navigator.geolocation) return Promise.resolve(null)
    if (import.meta.env.VITE_FEATURE_GEOFENCE === 'false') return Promise.resolve(null)

    setIsCapturing(true)
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const gps: GPSPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            precision: Math.round(pos.coords.accuracy),
          }
          setPosition(gps)
          setIsCapturing(false)
          resolve(gps)
        },
        (_err) => {
          // Falla silenciosa — el GPS es opcional según CLAUDE.md
          setIsCapturing(false)
          resolve(null)
        },
        { timeout: 5000, maximumAge: 30000 }
      )
    })
  }, [])

  return { position, isCapturing, capturar }
}
