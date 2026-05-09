import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

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
        qc.invalidateQueries({ queryKey: ['registros', 'dentro', equipoId] })
        qc.invalidateQueries({ queryKey: ['registros', 'historial', equipoId] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [equipoId, qc])
}

// Suscripción realtime para el mapa admin
export function useRealtimeMapa() {
  const qc = useQueryClient()
  const { usuario } = useAuthStore()

  useEffect(() => {
    const channel = supabase
      .channel('mapa-equipos')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'registros_acceso',
      }, () => {
        qc.invalidateQueries({ queryKey: ['equipos'] })
        qc.invalidateQueries({ queryKey: ['kpi', 'personas-dentro', usuario?.empresa_id] })
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
  }, [qc, usuario?.empresa_id])
}

// Suscripción realtime para el dashboard admin
export function useRealtimeDashboard() {
  const qc = useQueryClient()
  const { usuario } = useAuthStore()

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-admin')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'registros_acceso',
      }, () => {
        // Invalidar KPIs con el empresaId correcto
        qc.invalidateQueries({ queryKey: ['kpi', 'personas-dentro', usuario?.empresa_id] })
        qc.invalidateQueries({ queryKey: ['kpi', 'ingresos-hoy', usuario?.empresa_id] })
        qc.invalidateQueries({ queryKey: ['kpi', 'recientes', usuario?.empresa_id] })
        qc.invalidateQueries({ queryKey: ['equipos'] })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'registros_acceso',
      }, () => {
        qc.invalidateQueries({ queryKey: ['kpi', 'personas-dentro', usuario?.empresa_id] })
        qc.invalidateQueries({ queryKey: ['kpi', 'recientes', usuario?.empresa_id] })
        qc.invalidateQueries({ queryKey: ['equipos'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [qc, usuario?.empresa_id])
}
