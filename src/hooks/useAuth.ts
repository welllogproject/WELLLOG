// src/hooks/useAuth.ts
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { queryClient } from '@/lib/queryClient'
import type { Usuario } from '@/types/models'
import type { Rol } from '@/types/roles'
import { PERMISOS } from '@/types/roles'

export function useAuth() {
  const { usuario, isLoading, equipoId, setUsuario, setLoading, logout: storeLogout } = useAuthStore()

  const logout = async () => {
    await supabase.auth.signOut()
    storeLogout()
    queryClient.clear()
  }

  const tienePermiso = (permiso: keyof typeof PERMISOS[Rol]) => {
    if (!usuario) return false
    return !!PERMISOS[usuario.rol][permiso]
  }

  return {
    usuario,
    isLoading,
    isAuthenticated: !!usuario,
    rol: usuario?.rol ?? null,
    empresaId: usuario?.empresa_id ?? null,
    equipoId,
    logout,
    tienePermiso,
  }
}

export function useAuthInit() {
  const { setUsuario, setLoading } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // Estrategia dual:
    // 1. getSession() inmediato — no espera eventos, funciona aunque el SW
    //    haya limpiado el localStorage (Supabase guarda la sesión en cookies también)
    // 2. onAuthStateChange — para cambios futuros (login, logout, refresh)

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error || !session?.user) {
          // Sin sesión válida
          setUsuario(null)
          setLoading(false)
          return
        }

        // Sesión válida — cargar perfil
        await cargarUsuario(session.user.id, setUsuario)
        if (mounted) setLoading(false)
      } catch {
        if (mounted) {
          setUsuario(null)
          setLoading(false)
        }
      }
    }

    init()

    // Listener para cambios futuros
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          await cargarUsuario(session.user.id, setUsuario)
          if (mounted) setLoading(false)
          return
        }

        if (event === 'SIGNED_OUT') {
          setUsuario(null)
          setLoading(false)
          queryClient.clear()
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          if (!session?.user) {
            setUsuario(null)
            setLoading(false)
            queryClient.clear()
          }
          return
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

async function cargarUsuario(
  userId: string,
  setUsuario: (u: Usuario | null) => void,
  retries = 2
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setUsuario(null)
          return
        }
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 600 * (attempt + 1)))
          continue
        }
        return
      }

      if (data) setUsuario(data as Usuario)
      return
    } catch (err) {
      if (attempt >= retries) {
        console.error('[WELL LOG] cargarUsuario exception:', err)
      }
    }
  }
}

export function useRequireAuth(rolesPermitidos?: Rol[]) {
  const navigate = useNavigate()
  const { usuario, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return
    if (!usuario) {
      navigate('/login', { replace: true })
      return
    }
    if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
      if (usuario.rol === 'operador') navigate('/operador', { replace: true })
      else if (usuario.rol === 'auditor') navigate('/auditor', { replace: true })
      else if (usuario.rol === 'superadmin') navigate('/superadmin', { replace: true })
      else navigate('/admin', { replace: true })
    }
  }, [usuario, isLoading, navigate, rolesPermitidos])
}
