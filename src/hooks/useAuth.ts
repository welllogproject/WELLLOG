// src/hooks/useAuth.ts
// Sesión, rol, permisos y logout

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

// Inicialización de sesión — llamar una sola vez en App.tsx
export function useAuthInit() {
  const { setUsuario, setLoading } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // 1) Chequeo sincrónico de la session almacenada por supabase-js.
    //    Si no hay session valida (refresh token expirado), limpiar el usuario rehidratado
    //    de localStorage para que el guard mande a /login.
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return
      if (error || !data.session?.user) {
        setUsuario(null)
        setLoading(false)
        return
      }
      await cargarUsuario(data.session.user.id, setUsuario)
      if (mounted) setLoading(false)
    })

    // 2) Suscripcion para futuros cambios (login, logout, refresh, expiracion).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          await cargarUsuario(session.user.id, setUsuario)
        } else if (event === 'SIGNED_OUT') {
          setUsuario(null)
          queryClient.clear()
        } else if (event === 'TOKEN_REFRESHED' && !session) {
          // Refresh fallido — sesion expirada
          setUsuario(null)
          queryClient.clear()
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
        // Sólo limpiar el usuario si es 'no encontrado' explícito
        if (error.code === 'PGRST116') {
          console.error('[WELL LOG] Usuario no existe en tabla usuarios')
          setUsuario(null)
          return
        }
        // Error transitorio: reintenta
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)))
          continue
        }
        console.error('[WELL LOG] Error cargando usuario tras reintentos:', error.message)
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

// Guard de ruta por rol
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
      // Redirigir al home correcto según rol
      if (usuario.rol === 'operador') navigate('/operador', { replace: true })
      else navigate('/admin', { replace: true })
    }
  }, [usuario, isLoading, navigate, rolesPermitidos])
}
