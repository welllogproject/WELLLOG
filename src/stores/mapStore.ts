// src/stores/mapStore.ts
// Estado del mapa de equipos

import { create } from 'zustand'
import type { Equipo } from '@/types/models'

interface MapState {
  equipoSeleccionado: Equipo | null
  isPanelOpen: boolean
  filtroEstado: string | null    // 'activo' | 'mantenimiento' | 'inactivo' | null
  searchQuery: string

  // Actions
  seleccionarEquipo: (equipo: Equipo | null) => void
  cerrarPanel: () => void
  setFiltroEstado: (estado: string | null) => void
  setSearchQuery: (q: string) => void
}

export const useMapStore = create<MapState>()((set) => ({
  equipoSeleccionado: null,
  isPanelOpen: false,
  filtroEstado: null,
  searchQuery: '',

  seleccionarEquipo: (equipo) => set({
    equipoSeleccionado: equipo,
    isPanelOpen: !!equipo,
  }),

  cerrarPanel: () => set({
    equipoSeleccionado: null,
    isPanelOpen: false,
  }),

  setFiltroEstado: (estado) => set({ filtroEstado: estado }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
