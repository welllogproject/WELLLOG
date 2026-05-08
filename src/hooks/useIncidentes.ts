// src/hooks/useIncidentes.ts
// Declaraciones de incidentes y métricas HSE

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import type { Incidente, FormIncidenteData } from '@/types/models'

const QUERY_KEY = 'incidentes'

export function useIncidentes(equipoId?: string, estado?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, equipoId, estado],
    queryFn: async () => {
      let query = supabase
        .from('incidentes')
        .select('*, equipo:equipos(nombre_equipo, locacion:locaciones(codigo))')
        .order('fecha_incidente', { ascending: false })
        .limit(100)

      if (equipoId) query = query.eq('equipo_id', equipoId)
      if (estado) query = query.eq('estado', estado)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Incidente[]
    },
  })
}

export function useIncidentesPendientes() {
  return useQuery({
    queryKey: [QUERY_KEY, 'pendientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidentes')
        .select('count', { count: 'exact', head: true })
        .eq('estado', 'pendiente')

      if (error) throw error
      return data
    },
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
  })
}
