import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import type { Locacion } from '@/types/models'

const KEY = 'locaciones'

export function useLocaciones() {
  const { usuario } = useAuthStore()
  return useQuery({
    queryKey: [KEY, usuario?.empresa_id],
    queryFn: async () => {
      if (!usuario?.empresa_id) return []
      const { data, error } = await supabase
        .from('locaciones')
        .select('*')
        .eq('empresa_id', usuario.empresa_id)
        .order('codigo')
      if (error) throw error
      return (data ?? []) as Locacion[]
    },
    enabled: !!usuario?.empresa_id,
  })
}

export interface LocacionForm {
  codigo: string
  nombre?: string
  descripcion?: string
  lat?: number
  lng?: number
  activa?: boolean
}

export function useCrearLocacion() {
  const qc = useQueryClient()
  const { usuario } = useAuthStore()
  return useMutation({
    mutationFn: async (form: LocacionForm) => {
      if (!usuario?.empresa_id) throw new Error('Sin empresa asignada')
      const payload: Record<string, unknown> = {
        empresa_id: usuario.empresa_id,
        codigo: form.codigo,
        nombre: form.nombre,
        descripcion: form.descripcion,
        activa: form.activa ?? true,
      }
      if (form.lat !== undefined && form.lng !== undefined) {
        payload.ubicacion_punto = `POINT(${form.lng} ${form.lat})`
      }
      const { data, error } = await supabase
        .from('locaciones')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Locacion
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Locación creada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useActualizarLocacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...form }: LocacionForm & { id: string }) => {
      const payload: Record<string, unknown> = {
        codigo: form.codigo,
        nombre: form.nombre,
        descripcion: form.descripcion,
        activa: form.activa,
      }
      if (form.lat !== undefined && form.lng !== undefined) {
        payload.ubicacion_punto = `POINT(${form.lng} ${form.lat})`
      }
      const { error } = await supabase
        .from('locaciones')
        .update(payload)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Locación actualizada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
