// src/stores/offlineStore.ts
// Cola offline con IndexedDB via Zustand

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { OperacionOffline } from '@/types/models'

interface OfflineState {
  cola: OperacionOffline[]
  isOnline: boolean
  isSyncing: boolean
  lastSyncAt: string | null

  // Actions
  encolar: (op: Omit<OperacionOffline, 'id' | 'intentos' | 'created_at_local'>) => void
  desencolar: (id: string) => void
  marcarError: (id: string, error: string) => void
  setOnline: (online: boolean) => void
  setSyncing: (syncing: boolean) => void
  setLastSync: (at: string) => void
  clearCola: () => void
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      cola: [],
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncAt: null,

      encolar: (op) => {
        const MAX_QUEUE = parseInt(import.meta.env.VITE_MAX_OFFLINE_QUEUE || '200')
        const cola = get().cola
        if (cola.length >= MAX_QUEUE) {
          console.warn('[FieldPass] Cola offline llena — se descarta la operación más antigua')
          set((s) => ({ cola: [...s.cola.slice(1)] }))
        }
        const nueva: OperacionOffline = {
          ...op,
          id: crypto.randomUUID(),
          intentos: 0,
          created_at_local: new Date().toISOString(),
        }
        set((s) => ({ cola: [...s.cola, nueva] }))
      },

      desencolar: (id) =>
        set((s) => ({ cola: s.cola.filter((op) => op.id !== id) })),

      marcarError: (id, error) =>
        set((s) => ({
          cola: s.cola.map((op) =>
            op.id === id
              ? { ...op, intentos: op.intentos + 1, error_ultimo: error }
              : op
          ),
        })),

      setOnline: (online) => set({ isOnline: online }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setLastSync: (at) => set({ lastSyncAt: at }),
      clearCola: () => set({ cola: [] }),
    }),
    {
      name: 'fieldpass-offline-queue',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
