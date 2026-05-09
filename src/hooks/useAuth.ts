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
  const { usuario, setUsuario, setLoading } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // Si ya tenemos usuario rehidratado del localStorage, ya estamos listos.
    // El onAuthStateChange validará en background.
    if (usuario) {
      setLoading(false)
    }

    // Safety net por si onAuthStateChange no se dispara (cold start largo o red caída).
    // Si no hay usuario rehidratado, esperamos hasta 12s antes de soltar el lock.
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[WELL LOG] Auth init timeout — forcing ready state')
        setLoading(false)
      }
    }, usuario ? 0 : 12000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
          // Refresh en background — no bloquea si ya teníamos usuario rehidratado
          await cargarUsuario(session.user.id, setUsuario)
        } else if (event === 'SIGNED_OUT') {
          setUsuario(null)
          queryClient.clear()
        } else if (event === 'INITIAL_SESSION' && !session) {
          // No hay sesión válida — limpiar usuario rehidratado si existe
          setUsuario(null)
        }

        clearTimeout(safetyTimeout)
        if (mounted) setLoading(false)
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
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
