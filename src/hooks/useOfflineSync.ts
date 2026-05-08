// src/hooks/useOfflineSync.ts
// Sincronización automática al reconectar

import { useEffect, useRef } from 'react'
import { useOfflineStore } from '@/stores/offlineStore'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import toast from 'react-hot-toast'

export function useOfflineSync() {
  const { cola, isOnline, isSyncing, desencolar, marcarError, setOnline, setSyncing, setLastSync } = useOfflineStore()
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Detectar cambios de conectividad
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      toast.success('Conexión restaurada — sincronizando...')
    }
    const handleOffline = () => {
      setOnline(false)
      toast.error('Sin conexión — los registros se guardan localmente')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  // Sync periódico
  useEffect(() => {
    const INTERVAL = parseInt(import.meta.env.VITE_OFFLINE_SYNC_INTERVAL_MS || '30000')

    const sync = async () => {
      if (!isOnline || isSyncing || cola.length === 0) return

      setSyncing(true)
      let syncedCount = 0

      // Ordenar por created_at_local (cronológico)
      const sorted = [...cola].sort(
        (a, b) => new Date(a.created_at_local).getTime() - new Date(b.created_at_local).getTime()
      )

      for (const op of sorted) {
        try {
          const { error } = await supabase.from(op.tabla).insert(op.datos)
          if (error) {
            marcarError(op.id, error.message)
          } else {
            desencolar(op.id)
            syncedCount++
          }
        } catch (err) {
          marcarError(op.id, String(err))
        }
      }

      if (syncedCount > 0) {
        setLastSync(new Date().toISOString())
        queryClient.invalidateQueries()
        toast.success(`${syncedCount} registro${syncedCount > 1 ? 's' : ''} sincronizado${syncedCount > 1 ? 's' : ''}`)
      }

      setSyncing(false)
    }

    syncIntervalRef.current = setInterval(sync, INTERVAL)
    // Sync inmediato al montar si hay cola
    if (isOnline && cola.length > 0) sync()

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    }
  }, [isOnline, isSyncing, cola, desencolar, marcarError, setSyncing, setLastSync])

  return { isOnline, isSyncing, colaPendiente: cola.length }
}
