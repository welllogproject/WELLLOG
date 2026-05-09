import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

// Suscripción realtime para el dashboard del operador
export function useRealtimeEquipo(equipoId: string | null) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!equipoId) return

    const channel = supabase
      .channel(`equipo-${equipoId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'registros_acceso',
        filter: `equipo_id=eq.${equipoId}`,
      }, () => {
        // Query key correcto: ['registros', 'dentro', equipoId]
        qc.invalidateQueries({ queryKey: ['registros', 'dentro', equipoId] })
        qc.invalidateQueries({ queryKey: ['registros', 'historial', equipoId] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [equipoId, qc])
}

// Suscripción realtime para el mapa admin (todos los equipos)
export function useRealtimeMapa() {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('mapa-equipos')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'registros_acceso',
      }, () => {
        qc.invalidateQueries({ queryKey: ['equipos'] })
        qc.invalidateQueries({ queryKey: ['kpi'] })
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'incidentes',
      }, () => {
        qc.invalidateQueries({ queryKey: ['incidentes'] })
        qc.invalidateQueries({ queryKey: ['auditor', 'stats'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [qc])
}

// Suscripción realtime para el dashboard admin
export function useRealtimeDashboard() {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-admin')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'registros_acceso',
      }, () => {
        qc.invalidateQueries({ queryKey: ['kpi'] })
        qc.invalidateQueries({ queryKey: ['equipos'] })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'registros_acceso',
      }, () => {
        qc.invalidateQueries({ queryKey: ['kpi'] })
        qc.invalidateQueries({ queryKey: ['equipos'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [qc])
}
