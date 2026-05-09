// src/components/shared/OfflineBanner.tsx
// Banner de estado de conexión — visible en la tablet del operador

import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useOfflineStore } from '@/stores/offlineStore'

const MAX_QUEUE = parseInt(import.meta.env.VITE_MAX_OFFLINE_QUEUE || '200')

export function OfflineBanner() {
  const { isOnline, isSyncing, cola, lastSyncAt } = useOfflineStore()

  const pendientes = cola.filter((op) => op.intentos < 3).length
  const conError = cola.filter((op) => op.intentos >= 3).length
  const colaLlena = cola.length >= MAX_QUEUE - 10

  // Sin conexión
  if (!isOnline) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-[#BA7517]/12 border-b border-[#BA7517]/25">
        <WifiOff size={15} className="text-[#BA7517] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#7A4E0F]">
            Sin conexión
            {pendientes > 0 && ` — ${pendientes} registro${pendientes > 1 ? 's' : ''} en cola`}
          </p>
          {lastSyncAt && (
            <p className="text-xs text-[#BA7517] mt-0.5">
              Última sync: {new Date(lastSyncAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        {colaLlena && (
          <div className="flex items-center gap-1 text-xs font-semibold text-[#E24B4A] flex-shrink-0">
            <AlertTriangle size={13} />
            Cola llena
          </div>
        )}
      </div>
    )
  }

  // Sincronizando
  if (isSyncing && pendientes > 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-[#7F77DD]/10 border-b border-[#7F77DD]/20">
        <RefreshCw size={15} className="text-[#7F77DD] animate-spin flex-shrink-0" />
        <p className="text-sm font-medium text-[#534AB7]">
          Sincronizando {pendientes} registro{pendientes > 1 ? 's' : ''}...
        </p>
      </div>
    )
  }

  // Con errores de sync
  if (conError > 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-[#E24B4A]/8 border-b border-[#E24B4A]/20">
        <AlertTriangle size={15} className="text-[#E24B4A] flex-shrink-0" />
        <p className="text-sm font-medium text-[#b93332]">
          {conError} registro{conError > 1 ? 's' : ''} con error de sync — contactá al admin
        </p>
      </div>
    )
  }

  // Cola pendiente (online pero aún no sincronizó)
  if (pendientes > 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-[#7F77DD]/10 border-b border-[#7F77DD]/20">
        <RefreshCw size={15} className="text-[#7F77DD] flex-shrink-0" />
        <p className="text-sm font-medium text-[#534AB7]">
          {pendientes} registro{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} de sync
        </p>
      </div>
    )
  }

  // Todo OK — no mostrar nada
  return null
}
