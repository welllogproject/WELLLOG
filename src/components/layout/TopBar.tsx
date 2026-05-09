// src/components/layout/TopBar.tsx
import { Bell, Wifi, WifiOff, BookOpen, Menu } from 'lucide-react'
import { useOfflineStore } from '@/stores/offlineStore'
import { SupportButton } from '@/components/shared/SupportButton'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  onHelp?: () => void
  onMenuToggle?: () => void
}

export function TopBar({ title, subtitle, actions, onHelp, onMenuToggle }: TopBarProps) {
  const { isOnline, cola } = useOfflineStore()

  return (
    <header className="h-14 bg-[var(--card-bg)] border-b border-[var(--border)] flex items-center px-4 lg:px-6 gap-3 flex-shrink-0 transition-colors duration-200">
      {/* Botón hamburguesa — solo en móvil/tablet */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-[10px] hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Título */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-medium text-[var(--text-primary)] truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[var(--text-muted)] truncate hidden sm:block">{subtitle}</p>}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {actions}

        {!isOnline && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BA7517]/10 text-[#BA7517] text-xs font-medium">
            <WifiOff size={12} />
            <span className="hidden md:inline">{cola.length > 0 ? `${cola.length} en cola` : 'Sin conexión'}</span>
          </div>
        )}

        {isOnline && cola.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7F77DD]/10 text-[#7F77DD] text-xs font-medium">
            <Wifi size={12} />
            <span className="hidden md:inline">Sincronizando...</span>
          </div>
        )}

        {/* Botón de ayuda */}
        {onHelp && (
          <button
            onClick={onHelp}
            className="p-2 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[#7F77DD] transition-colors"
            aria-label="Guía de uso"
            title="¿Cómo se usa?"
          >
            <BookOpen size={17} />
          </button>
        )}

        <SupportButton variant="icon" />

        <button
          className="p-2 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors relative"
          aria-label="Notificaciones"
        >
          <Bell size={17} />
        </button>
      </div>
    </header>
  )
}
