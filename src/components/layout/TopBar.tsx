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
    <header className="h-14 bg-[var(--card-bg)] border-b border-[var(--border)] flex items-center px-6 gap-4 flex-shrink-0 transition-colors duration-200">
      {/* Título */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-medium text-[var(--text-primary)] truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {actions}

        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BA7517]/10 text-[#BA7517] text-xs font-medium">
            <WifiOff size={12} />
            {cola.length > 0 ? `${cola.length} en cola` : 'Sin conexión'}
          </div>
        )}

        {isOnline && cola.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7F77DD]/10 text-[#7F77DD] text-xs font-medium">
            <Wifi size={12} />
            Sincronizando...
          </div>
        )}

        <button
          className="p-2 rounded-full hover:bg-[var(--hover-bg)] dark:hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors relative"
          aria-label="Notificaciones"
        >
          <Bell size={17} />
        </button>
      </div>
    </header>
  )
}
