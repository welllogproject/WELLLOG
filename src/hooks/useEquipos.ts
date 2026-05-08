// src/hooks/useEquipos.ts
// CRUD equipos + personas dentro en tiempo real

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import type { Equipo } from '@/types/models'

const QUERY_KEY = 'equipos'

// Todos los equipos de la empresa (admin)
export function useEquipos() {
  return useQuery({
    queryKey: [QUERY_KEY, 'lista'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipos')
        .select(`
          *,
          locacion:locaciones(id, codigo, nombre),
          operador:usuarios!operador_asignado_id(id, nombre_completo, email)
        `)
        .is('deleted_at', null)
        .order('nombre_equipo')

      if (error) throw error
      return (data ?? []) as Equipo[]
    },
  })
}

// Un equipo por ID
export function useEquipo(equipoId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, equipoId],
    queryFn: async () => {
      if (!equipoId) return null
      const { data, error } = await supabase
        .from('equipos')
        .select(`
          *,
          locacion:locaciones(id, codigo, nombre),
          operador:usuarios!operador_asignado_id(id, nombre_completo, email)
        `)
        .eq('id', equipoId)
        .single()

      if (error) throw error
      return data as Equipo
    },
    enabled: !!equipoId,
  })
}

// Equipos con conteo de personas dentro (para mapa)
export function useEquiposConPersonas() {
  return useQuery({
    queryKey: [QUERY_KEY, 'mapa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipos')
        .select(`
          *,
          locacion:locaciones(id, codigo, nombre),
          registros_activos:registros_acceso(count)
        `)
        .is('deleted_at', null)
        .order('nombre_equipo')

      if (error) throw error
      return (data ?? []) as Equipo[]
    },
    refetchInterval: 30000,
  })
}

// Actualizar coordenadas del equipo
export function useActualizarUbicacion() {
  const qc = useQueryClient()
  const { usuario } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      equipoId,
      lat,
      lng,
      locacionId,
    }: {
      equipoId: string
      lat: number
      lng: number
      locacionId?: string
    }) => {
      if (!usuario) throw new Error('Sin usuario')

      const payload: Record<string, unknown> = {
        // PostGIS POINT format
        ubicacion_punto: `POINT(${lng} ${lat})`,
        coordenadas_actualizadas_por: usuario.id,
        fecha_ultima_ubicacion: new Date().toISOString(),
      }

      if (locacionId) payload.locacion_actual_id = locacionId

      const { error } = await supabase
        .from('equipos')
        .update(payload)
        .eq('id', equipoId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Ubicación actualizada')
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    },
  })
}
