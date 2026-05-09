// src/hooks/useRegistros.ts
// CRUD registros de acceso + búsqueda por DNI

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useOfflineStore } from '@/stores/offlineStore'
import toast from 'react-hot-toast'
import type { RegistroAcceso, FormIngresoData, FormSalidaData } from '@/types/models'

const QUERY_KEY = 'registros'

// Personas actualmente DENTRO de un equipo
export function usePersonasDentro(equipoId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'dentro', equipoId],
    queryFn: async () => {
      if (!equipoId) return []
      const { data, error } = await supabase
        .from('registros_acceso')
        .select('*')
        .eq('equipo_id', equipoId)
        .eq('estado', 'dentro')
        .is('deleted_at', null)
        .order('fecha_ingreso', { ascending: false })

      if (error) throw error
      return (data ?? []) as RegistroAcceso[]
    },
    enabled: !!equipoId,
    refetchInterval: 30000, // Refresh cada 30s
  })
}

// Historial de registros de un equipo (para autocomplete de DNI)
export function useHistorialDNI(equipoId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'historial', equipoId],
    queryFn: async () => {
      if (!equipoId) return []
      const { data, error } = await supabase
        .from('registros_acceso')
        .select('dni, nombre_completo, empresa_visitante_nombre, funcion_visitante')
        .eq('equipo_id', equipoId)
        .is('deleted_at', null)
        .order('fecha_ingreso', { ascending: false })
        .limit(500)

      if (error) throw error
      // Deduplicar por DNI, quedarse con el más reciente
      const mapa = new Map<string, typeof data[0]>()
      for (const r of data ?? []) {
        if (r.dni && !mapa.has(r.dni)) mapa.set(r.dni, r)
      }
      return Array.from(mapa.values())
    },
    enabled: !!equipoId,
    staleTime: 1000 * 60 * 5, // 5 min — el historial no cambia tan seguido
  })
}

// Verificar si un DNI ya tiene ingreso activo
export function useTieneIngresoActivo(dni: string, equipoId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'activo', dni, equipoId],
    queryFn: async () => {
      if (!equipoId || !dni || dni.length < 7) return null
      const { data, error } = await supabase
        .from('registros_acceso')
        .select('*')
        .eq('equipo_id', equipoId)
        .eq('dni', dni)
        .eq('estado', 'dentro')
        .is('deleted_at', null)
        .maybeSingle()

      if (error) throw error
      return data as RegistroAcceso | null
    },
    enabled: !!equipoId && dni.length >= 7,
  })
}

// Tabla de registros para admin con filtros
export function useRegistrosAdmin(equipoId?: string, fechaDesde?: string, fechaHasta?: string) {
  const { usuario } = useAuthStore()
  return useQuery({
    queryKey: [QUERY_KEY, 'admin', usuario?.empresa_id, equipoId, fechaDesde, fechaHasta],
    queryFn: async () => {
      if (!usuario?.empresa_id) return []

      // Primero obtenemos los IDs de equipos de esta empresa
      let query = supabase
        .from('registros_acceso')
        .select(`
          *,
          equipo:equipos!inner(id, nombre_equipo, empresa_contratista_id)
        `)
        .eq('equipos.empresa_contratista_id', usuario.empresa_id)
        .is('deleted_at', null)
        .order('fecha_ingreso', { ascending: false })
        .limit(500)

      if (equipoId) query = query.eq('equipo_id', equipoId)
      if (fechaDesde) query = query.gte('fecha_ingreso', fechaDesde)
      if (fechaHasta) query = query.lte('fecha_ingreso', fechaHasta)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as RegistroAcceso[]
    },
    enabled: !!usuario?.empresa_id,
  })
}

// Mutación: nuevo ingreso
export function useNuevoIngreso() {
  const qc = useQueryClient()
  const { usuario, equipoId } = useAuthStore()
  const { encolar, isOnline } = useOfflineStore()

  return useMutation({
    mutationFn: async (form: FormIngresoData) => {
      if (!equipoId || !usuario) throw new Error('Sin equipo o usuario asignado')

      const payload = {
        equipo_id: equipoId,
        dni: form.dni,
        tipo_documento: form.tipo_documento,
        nombre_completo: form.nombre_completo,
        empresa_visitante_nombre: form.empresa_visitante_nombre,
        funcion_visitante: form.funcion_visitante,
        motivo_visita: form.motivo_visita,
        vehiculo_patente: form.vehiculo_patente || null,
        firma_ingreso_data: form.firma_data,
        estado: 'dentro' as const,
        registrado_por_usuario_id: usuario.id,
        created_at_local: new Date().toISOString(),
      }

      if (!isOnline) {
        encolar({ tipo: 'insert_registro', tabla: 'registros_acceso', datos: payload })
        return { offline: true }
      }

      const { data, error } = await supabase
        .from('registros_acceso')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, 'dentro'] })
      qc.invalidateQueries({ queryKey: [QUERY_KEY, 'historial'] })
    },
    onError: (error) => {
      toast.error(`Error al registrar ingreso: ${error.message}`)
    },
  })
}

// Mutación: marcar egreso + declaración de incidente
export function useMarcarEgreso() {
  const qc = useQueryClient()
  const { usuario } = useAuthStore()
  const { isOnline } = useOfflineStore()

  return useMutation({
    mutationFn: async (data: FormSalidaData & { firma_egreso_data?: string }) => {
      if (!usuario) throw new Error('Sin usuario')

      const payload = {
        fecha_egreso: new Date().toISOString(),
        declara_incidente: data.declara_incidente,
        firma_declaracion_data: data.firma_declaracion_data,
        firma_egreso_data: data.firma_egreso_data || null,
        estado: 'afuera' as const,
        actualizado_por_usuario_id: usuario.id,
      }

      const { error } = await supabase
        .from('registros_acceso')
        .update(payload)
        .eq('id', data.registro_id)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
    onError: (error) => {
      toast.error(`Error al marcar egreso: ${error.message}`)
    },
  })
}
