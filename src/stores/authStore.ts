// src/stores/authStore.ts
// Estado de autenticación global (Zustand)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '@/types/models'
import type { Rol } from '@/types/roles'
import { PERMISOS } from '@/types/roles'

interface AuthState {
  usuario: Usuario | null
  equipoId: string | null         // Solo para operadores — persistido
  isLoading: boolean

  // Actions
  setUsuario: (usuario: Usuario | null) => void
  setEquipoId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void

  // Helpers derivados
  isAuthenticated: () => boolean
  rol: () => Rol | null
  empresaId: () => string | null
  tienePermiso: (permiso: keyof typeof PERMISOS[Rol]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      equipoId: null,
      isLoading: true,

      setUsuario: (usuario) => set({ usuario }),
      setEquipoId: (id) => set({ equipoId: id }),
      setLoading: (loading) => set({ isLoading: loading }),

      logout: () => set({
        usuario: null,
        // NO limpiar equipoId — la tablet sigue siendo del mismo equipo
      }),

      isAuthenticated: () => !!get().usuario,
      rol: () => get().usuario?.rol ?? null,
      empresaId: () => get().usuario?.empresa_id ?? null,

      tienePermiso: (permiso) => {
        const rol = get().usuario?.rol
        if (!rol) return false
        return !!PERMISOS[rol][permiso]
      },
    }),
    {
      name: 'fieldpass-auth',
      partialize: (state) => ({
        // Solo persistir el equipo_id, no el usuario (se rehidrata desde Supabase)
        equipoId: state.equipoId,
      }),
    }
  )
)
