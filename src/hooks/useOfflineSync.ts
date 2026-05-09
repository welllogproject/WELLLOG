// src/hooks/useOfflineSync.ts
// Sincronización automática al reconectar
//
// FLUJO OFFLINE EN CAMPO:
// 1. Tablet sin internet → operador registra ingresos normalmente
// 2. Cada operación se encola en localStorage (hasta 200 registros)
// 3. Al reconectar → sync automático en orden cronológico
// 4. Si un registro falla (ej: duplicado) → se marca con error y se salta
// 5. El operador puede ver cuántos están pendientes en el OfflineBanner

import { useEffect, useRef, useCallback } from 'react'
import { useOfflineStore } from '@/stores/offlineStore'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import toast from 'react-hot-toast'

const MAX_INTENTOS = 3

export function useOfflineSync() {
  const {
    cola, isOnline, isSyncing,
    desencolar, marcarError, setOnline, setSyncing, setLastSync,
  } = useOfflineStore()

  const syncRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const syncingRef = useRef(false) // Evita doble ejecución

  const sync = useCallback(async () => {
    if (!isOnline || syncingRef.current) return
    const pendientes = cola.filter((op) => op.intentos < MAX_INTENTOS)
    if (pendientes.length === 0) return

    syncingRef.current = true
    setSyncing(true)

    let syncedCount = 0
    let errorCount = 0

    // Ordenar cronológicamente — importante para integridad de datos
    const sorted = [...pendientes].sort(
      (a, b) => new Date(a.created_at_local).getTime() - new Date(b.created_at_local).getTime()
    )

    for (const op of sorted) {
      try {
        if (op.tipo === 'insert_registro') {
          const { error } = await supabase.from(op.tabla).insert(op.datos)
          if (error) {
            // Error de duplicado (23505) → desencolar igual, ya está en la DB
            if (error.code === '23505') {
              desencolar(op.id)
              syncedCount++
            } else {
              marcarError(op.id, error.message)
              errorCount++
            }
          } else {
            desencolar(op.id)
            syncedCount++
          }
        } else if (op.tipo === 'update_egreso') {
          const { id, ...datos } = op.datos as { id: string; [key: string]: unknown }
          const { error } = await supabase.from(op.tabla).update(datos).eq('id', id)
          if (error) {
            marcarError(op.id, error.message)
            errorCount++
          } else {
            desencolar(op.id)
            syncedCount++
          }
        } else if (op.tipo === 'insert_incidente') {
          const { error } = await supabase.from(op.tabla).insert(op.datos)
          if (error) {
            if (error.code === '23505') {
              desencolar(op.id)
              syncedCount++
            } else {
              marcarError(op.id, error.message)
              errorCount++
            }
          } else {
            desencolar(op.id)
            syncedCount++
          }
        }
      } catch (err) {
        // Error de red — no incrementar intentos, reintentar en el próximo ciclo
        console.warn('[WELL LOG] Sync error de red:', err)
        break // Parar el ciclo si no hay red, no tiene sentido seguir
      }
    }

    if (syncedCount > 0) {
      setLastSync(new Date().toISOString())
      queryClient.invalidateQueries()
      toast.success(
        `✓ ${syncedCount} registro${syncedCount > 1 ? 's' : ''} sincronizado${syncedCount > 1 ? 's' : ''}`,
        { duration: 3000 }
      )
    }

    if (errorCount > 0) {
      toast.error(
        `${errorCount} registro${errorCount > 1 ? 's' : ''} con error — se reintentará`,
        { duration: 5000 }
      )
    }

    setSyncing(false)
    syncingRef.current = false
  }, [isOnline, cola, desencolar, marcarError, setSyncing, setLastSync])

  // Detectar cambios de conectividad
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      // Pequeño delay para que la conexión se estabilice
      setTimeout(() => sync(), 1500)
    }
    const handleOffline = () => {
      setOnline(false)
      toast('Sin conexión — registros guardados localmente', {
        icon: '📡',
        style: { background: '#BA7517', color: 'white' },
        duration: 4000,
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline, sync])

  // Sync periódico mientras hay conexión
  useEffect(() => {
    const INTERVAL = parseInt(import.meta.env.VITE_OFFLINE_SYNC_INTERVAL_MS || '30000')

    if (syncRef.current) clearInterval(syncRef.current)
    syncRef.current = setInterval(() => {
      if (isOnline && cola.length > 0) sync()
    }, INTERVAL)

    // Sync inmediato si hay cola y hay conexión
    if (isOnline && cola.length > 0) sync()

    return () => {
      if (syncRef.current) clearInterval(syncRef.current)
    }
  }, [isOnline, cola.length, sync])

  return { isOnline, isSyncing, colaPendiente: cola.length }
}
