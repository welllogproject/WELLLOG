// src/hooks/useIncidentes.ts
// Declaraciones de incidentes y métricas HSE

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import type { Incidente, FormIncidenteData } from '@/types/models'

const QUERY_KEY = 'incidentes'

// Admin: incidentes de sus propios equipos
// Operador: incidentes de su equipo asignado
// Superadmin: todos
export function useIncidentes(equipoId?: string, estado?: string) {
  const { usuario } = useAuthStore()

  return useQuery({
    queryKey: [QUERY_KEY, usuario?.empresa_id, usuario?.rol, equipoId, estado],
    queryFn: async () => {
      if (!usuario) return []

      let query = supabase
        .from('incidentes')
        .select(`
          *,
          equipo:equipos!inner(id, nombre_equipo, empresa_contratista_id, locacion:locaciones(codigo))
        `)
        .order('fecha_incidente', { ascending: false })
        .limit(100)

      // Superadmin ve todo; admin/supervisor/operador solo su empresa
      if (usuario.rol !== 'superadmin') {
        query = query.eq('equipos.empresa_contratista_id', usuario.empresa_id)
      }

      if (equipoId) query = query.eq('equipo_id', equipoId)
      if (estado) query = query.eq('estado', estado)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Incidente[]
    },
    enabled: !!usuario,
  })
}

// Conteo de incidentes pendientes — solo de la empresa del usuario
export function useIncidentesPendientes() {
  const { usuario } = useAuthStore()

  return useQuery({
    queryKey: [QUERY_KEY, 'pendientes', usuario?.empresa_id],
    queryFn: async () => {
      if (!usuario) return 0

      if (usuario.rol === 'superadmin') {
        const { count, error } = await supabase
          .from('incidentes')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'pendiente')
        if (error) throw error
        return count ?? 0
      }

      // Para otros roles: filtrar por equipos de la empresa
      const { data: equipos } = await supabase
        .from('equipos')
        .select('id')
        .eq('empresa_contratista_id', usuario.empresa_id)
        .is('deleted_at', null)

      const ids = (equipos ?? []).map((e) => e.id)
      if (ids.length === 0) return 0

      const { count, error } = await supabase
        .from('incidentes')
        .select('*', { count: 'exact', head: true })
        .in('equipo_id', ids)
        .eq('estado', 'pendiente')

      if (error) throw error
      return count ?? 0
    },
    enabled: !!usuario,
  })
}

export function useCrearIncidente() {
  const qc = useQueryClient()
  const { usuario, equipoId } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      registroId,
      form,
      locacionId,
      nombreAfectado,
      dniAfectado,
      empresaAfectado,
      funcionAfectado,
    }: {
      registroId: string
      form: FormIncidenteData
      locacionId?: string
      nombreAfectado: string
      dniAfectado: string
      empresaAfectado?: string
      funcionAfectado?: string
    }) => {
      if (!equipoId || !usuario) throw new Error('Sin equipo o usuario')

      const { error } = await supabase.from('incidentes').insert({
        registro_acceso_id: registroId,
        equipo_id: equipoId,
        locacion_id: locacionId || null,
        dni_afectado: dniAfectado,
        nombre_afectado: nombreAfectado,
        empresa_afectado: empresaAfectado || null,
        funcion_afectado: funcionAfectado || null,
        descripcion: form.descripcion,
        tipo: form.tipo,
        gravedad: form.gravedad,
        dias_perdidos: form.dias_perdidos,
        informo_jefe_turno: form.informo_jefe_turno,
        jefe_turno_nombre: form.jefe_turno_nombre || null,
        firma_jefe_data: form.firma_jefe_data || null,
        estado: 'pendiente',
        fecha_incidente: new Date().toISOString(),
      })

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Incidente registrado — el administrador fue notificado ⚠️')
    },
    onError: (error) => {
      toast.error(`Error al registrar incidente: ${error.message}`)
    },
  })
}

export function useCerrarIncidente() {
  const qc = useQueryClient()
  const { usuario } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      incidenteId,
      conclusion,
      acciones,
    }: {
      incidenteId: string
      conclusion: string
      acciones: string
    }) => {
      if (!usuario) throw new Error('Sin usuario')

      const { error } = await supabase
        .from('incidentes')
        .update({
          estado: 'cerrado',
          conclusion_investigacion: conclusion,
          acciones_correctivas: acciones,
          investigado_por: usuario.id,
          fecha_cierre: new Date().toISOString(),
        })
        .eq('id', incidenteId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Incidente cerrado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
