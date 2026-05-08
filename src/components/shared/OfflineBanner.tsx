// src/components/shared/OfflineBanner.tsx
// Banner "Sin conexión — X registros en cola"

import { WifiOff, RefreshCw } from 'lucide-react'
import { useOfflineStore } from '@/stores/offlineStore'

export function OfflineBanner() {
  const { isOnline, isSyncing, cola } = useOfflineStore()

  if (isOnline && cola.length === 0) return null

  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3 text-sm font-medium',
        !isOnline
          ? 'bg-[#BA7517]/10 text-[#7A4E0F] border-b border-[#BA7517]/20'
          : 'bg-[#7F77DD]/10 text-[#534AB7] border-b border-[#7F77DD]/20',
      ].join(' ')}
    >
      {!isOnline ? (
        <>
          <WifiOff size={16} className="flex-shrink-0" />
          <span>
            Sin conexión
            {cola.length > 0 && ` — ${cola.length} registro${cola.length > 1 ? 's' : ''} en cola`}
          </span>
        </>
      ) : (
        <>
          <RefreshCw size={16} className="animate-spin flex-shrink-0" />
          <span>
            Sincronizando {cola.length} registro{cola.length > 1 ? 's' : ''}...
          </span>
        </>
      )}
      {!isOnline && cola.length >= parseInt(import.meta.env.VITE_MAX_OFFLINE_QUEUE || '200') - 10 && (
        <span className="ml-auto text-xs font-semibold bg-[#BA7517]/20 px-2 py-0.5 rounded-full">
          ⚠️ Cola casi llena
        </span>
      )}
    </div>
  )
}
