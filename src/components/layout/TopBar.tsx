// src/components/layout/TopBar.tsx
import { Bell, Wifi, WifiOff } from 'lucide-react'
import { useOfflineStore } from '@/stores/offlineStore'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { isOnline, cola } = useOfflineStore()

  return (
    <header className="h-14 bg-white border-b border-[rgba(0,0,0,0.07)] flex items-center px-6 gap-4 flex-shrink-0">
      {/* Título */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-medium text-[#2C2C2A] truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[#888780]">{subtitle}</p>}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {actions}

        {/* Estado offline */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BA7517]/10 text-[#7A4E0F] text-xs font-medium">
            <WifiOff size={12} />
            {cola.length > 0 ? `${cola.length} en cola` : 'Sin conexión'}
          </div>
        )}

        {isOnline && cola.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7F77DD]/10 text-[#534AB7] text-xs font-medium">
            <Wifi size={12} />
            Sincronizando...
          </div>
        )}

        {/* Notificaciones (placeholder) */}
        <button
          className="p-2 rounded-full hover:bg-black/5 text-[#5F5E5A] transition-colors relative"
          aria-label="Notificaciones"
        >
          <Bell size={17} />
        </button>
      </div>
    </header>
  )
}
