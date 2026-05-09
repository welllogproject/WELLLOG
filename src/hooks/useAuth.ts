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
  const { setUsuario, setLoading, setEquipoId } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // Safety net: never leave the app stuck in loading state
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[WELL LOG] Auth init timeout — forcing ready state')
        setLoading(false)
      }
    }, 6000)

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted) {
          await cargarUsuario(session.user.id, setUsuario)
        }
      } catch (err) {
        console.error('[WELL LOG] Error inicializando sesión:', err)
      } finally {
        clearTimeout(safetyTimeout)
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'SIGNED_IN' && session?.user) {
          await cargarUsuario(session.user.id, setUsuario)
        } else if (event === 'SIGNED_OUT') {
          setUsuario(null)
          queryClient.clear()
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUsuario, setLoading, setEquipoId])
}

async function cargarUsuario(
  userId: string,
  setUsuario: (u: Usuario | null) => void
) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    console.error('[WELL LOG] Error cargando usuario:', error)
    setUsuario(null)
    return
  }

  setUsuario(data as Usuario)
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
