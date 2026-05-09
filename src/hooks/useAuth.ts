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
  const { setUsuario, setLoading, usuario } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // ESTRATEGIA DEFINITIVA:
    // 1. Si hay usuario en Zustand (localStorage) → quitar loading INMEDIATO
    //    Las queries arrancan de inmediato con el usuario disponible.
    // 2. En background, intentar refrescar la sesión de Supabase.
    //    Si falla o tarda → no importa, las queries ya están corriendo.
    //    Solo limpiar el usuario si Supabase dice explícitamente que no hay sesión
    //    Y el usuario no tiene token (primera vez o logout real).

    if (usuario) {
      // Usuario en localStorage → UI carga inmediatamente
      setLoading(false)

      // Intentar refrescar el token en background sin bloquear
      supabase.auth.refreshSession().then(({ data, error }) => {
        if (!mounted) return
        if (error) {
          // Si el refresh falla, intentar con getSession como fallback
          supabase.auth.getSession().then(({ data: sd }) => {
            if (!mounted) return
            if (!sd.session?.user) {
              // Sesión realmente expirada — limpiar y mandar al login
              setUsuario(null)
              queryClient.clear()
            }
          }).catch(() => {
            // Error de red — mantener el usuario, las queries van a fallar
            // individualmente y el usuario puede recargar
          })
        }
        // Si el refresh fue exitoso, el cliente de Supabase ya tiene el nuevo token
        // No necesitamos hacer nada más
      }).catch(() => {
        // Error de red en el refresh — mantener el usuario
      })

    } else {
      // Sin usuario en localStorage → verificar si hay sesión en Supabase
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!mounted) return
        if (session?.user) {
          await cargarUsuario(session.user.id, setUsuario)
        }
        if (mounted) setLoading(false)
      }).catch(() => {
        if (mounted) setLoading(false)
      })
    }

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

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token refrescado exitosamente — actualizar perfil si cambió
          if (mounted) setLoading(false)
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
