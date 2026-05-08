import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { Empresa, PlanEmpresa, TipoEmpresa } from '@/types/models'

const KEY = 'empresas'

export function useTodasEmpresas() {
  return useQuery({
    queryKey: [KEY, 'todas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nombre')
      if (error) throw error
      return (data ?? []) as Empresa[]
    },
  })
}

export function useContratistas() {
  return useQuery({
    queryKey: [KEY, 'contratistas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('tipo', 'contratista')
        .order('nombre')
      if (error) throw error
      return (data ?? []) as Empresa[]
    },
  })
}

export function useOperadoras() {
  return useQuery({
    queryKey: [KEY, 'operadoras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('tipo', 'operadora')
        .order('nombre')
      if (error) throw error
      return (data ?? []) as Empresa[]
    },
  })
}

export interface EmpresaForm {
  nombre: string
  tipo: TipoEmpresa
  razon_social?: string
  cuit?: string
  email_contacto?: string
  telefono?: string
  plan: PlanEmpresa
}

export function useCrearEmpresa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (form: EmpresaForm) => {
      const { data, error } = await supabase
        .from('empresas')
        .insert(form)
        .select()
        .single()
      if (error) throw error
      return data as Empresa
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Empresa creada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useActualizarEmpresa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...form }: Partial<EmpresaForm> & { id: string; activa?: boolean }) => {
      const { error } = await supabase
        .from('empresas')
        .update(form)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Empresa actualizada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Permisos de acceso entre empresas ──────────────────────

import type { PermisoAcceso, TipoAcceso } from '@/types/models'

const PERM_KEY = 'permisos_acceso'

export function usePermisosAcceso() {
  return useQuery({
    queryKey: [PERM_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permisos_acceso')
        .select(`
          *,
          empresa_propietaria:empresas!empresa_propietaria_id(id, nombre, tipo),
          empresa_auditora:empresas!empresa_auditora_id(id, nombre, tipo),
          equipo:equipos(id, nombre_equipo)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as PermisoAcceso[]
    },
  })
}

export interface PermisoForm {
  empresa_propietaria_id: string
  empresa_auditora_id: string
  equipo_id?: string
  tipo_acceso: TipoAcceso
  puede_ver_incidentes: boolean
  puede_ver_hse: boolean
  puede_ver_coordenadas: boolean
  fecha_inicio: string
  fecha_fin?: string
}

export function useCrearPermiso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (form: PermisoForm) => {
      const { error } = await supabase.from('permisos_acceso').insert(form)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PERM_KEY] })
      toast.success('Permiso creado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useTogglePermiso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from('permisos_acceso').update({ activo }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PERM_KEY] })
      toast.success('Permiso actualizado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Usuarios (superadmin: todos) ───────────────────────────

import type { Usuario, EstadoUsuario } from '@/types/models'
import type { Rol } from '@/types/roles'

const USR_KEY = 'usuarios'

export function useTodosUsuarios() {
  return useQuery({
    queryKey: [USR_KEY, 'todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`*, empresa:empresas(id, nombre, tipo)`)
        .order('nombre_completo')
      if (error) throw error
      return (data ?? []) as (Usuario & { empresa?: Empresa })[]
    },
  })
}

export interface UsuarioForm {
  empresa_id: string
  nombre_completo: string
  email: string
  rol: Rol
  dni?: string
  telefono?: string
}

export function useCrearUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (form: UsuarioForm) => {
      // Invita al usuario por email. Supabase enviará un magic link.
      // El perfil en 'usuarios' se crea al confirmar via trigger o manualmente.
      const { error } = await supabase.auth.admin.inviteUserByEmail(form.email, {
        data: {
          empresa_id: form.empresa_id,
          nombre_completo: form.nombre_completo,
          rol: form.rol,
          dni: form.dni,
          telefono: form.telefono,
        },
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USR_KEY] })
      toast.success('Invitación enviada al email del usuario')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useActualizarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      estado,
      rol,
      nombre_completo,
      telefono,
    }: {
      id: string
      estado?: EstadoUsuario
      rol?: Rol
      nombre_completo?: string
      telefono?: string
    }) => {
      const payload: Record<string, unknown> = {}
      if (estado !== undefined) payload.estado = estado
      if (rol !== undefined) payload.rol = rol
      if (nombre_completo !== undefined) payload.nombre_completo = nombre_completo
      if (telefono !== undefined) payload.telefono = telefono

      const { error } = await supabase.from('usuarios').update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USR_KEY] })
      toast.success('Usuario actualizado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
