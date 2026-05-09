// src/components/layout/TabletLayout.tsx
// Layout mobile-first para el operador — sin sidebar
import { WifiOff } from 'lucide-react'
import { useOfflineStore } from '@/stores/offlineStore'
import { SupportButton } from '@/components/shared/SupportButton'

interface TabletLayoutProps {
  children: React.ReactNode
  equipoNombre?: string
  locacionCodigo?: string
}

export function TabletLayout({ children, equipoNombre, locacionCodigo }: TabletLayoutProps) {
  const { isOnline, cola } = useOfflineStore()

  return (
    <div className="min-h-screen bg-[var(--input-bg)] flex flex-col">
      {/* Header compacto */}
      <header className="bg-[var(--card-bg)] border-b border-[var(--border)] px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--btn-ingreso)' }}>
            <span className="text-white text-xs font-semibold">WL</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {equipoNombre || 'WELL LOG'}
            </span>
            {locacionCodigo && (
              <span className="text-[10px] text-[var(--text-muted)] ml-1.5">— {locacionCodigo}</span>
            )}
          </div>
        </div>

        {/* Indicador offline */}
        {!isOnline && (
          <div className="flex items-center gap-1 text-[#BA7517]">
            <WifiOff size={14} />
            {cola.length > 0 && (
              <span className="text-xs font-medium">{cola.length}</span>
            )}
          </div>
        )}
      </header>

      {/* Contenido */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Botón de soporte flotante */}
      <SupportButton variant="fab" />
    </div>
  )
}
