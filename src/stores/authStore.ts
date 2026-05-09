// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '@/types/models'
import type { Rol } from '@/types/roles'
import { PERMISOS } from '@/types/roles'

interface AuthState {
  usuario: Usuario | null
  equipoId: string | null
  isLoading: boolean
  _hydrated: boolean

  setUsuario: (usuario: Usuario | null) => void
  setEquipoId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setHydrated: (v: boolean) => void
  logout: () => void

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
      _hydrated: false,

      setUsuario: (usuario) => set({ usuario }),
      setEquipoId: (id) => set({ equipoId: id }),
      setLoading: (loading) => set({ isLoading: loading }),
      setHydrated: (v) => set({ _hydrated: v }),

      logout: () => set({ usuario: null }),

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
        equipoId: state.equipoId,
        usuario: state.usuario,
      }),
      onRehydrateStorage: () => (state) => {
        // Siempre marcar como hidratado, con o sin datos
        // Si el localStorage está vacío (SW lo limpió), _hydrated = true
        // para que el spinner no quede colgado
        if (state) {
          state._hydrated = true
          // Si hay usuario en localStorage, no bloquear la UI
          if (state.usuario) state.isLoading = false
        }
      },
    }
  )
)
