// src/components/layout/TabletLayout.tsx
// Layout mobile-first para el operador — sin sidebar
import { useState } from 'react'
import { WifiOff, LogOut, Menu, X } from 'lucide-react'
import { useOfflineStore } from '@/stores/offlineStore'
import { SupportButton } from '@/components/shared/SupportButton'
import { OnboardingGuide, useOnboardingGuide } from '@/components/shared/OnboardingGuide'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { Rol } from '@/types/roles'

interface TabletLayoutProps {
  children: React.ReactNode
  equipoNombre?: string
  locacionCodigo?: string
}

export function TabletLayout({ children, equipoNombre, locacionCodigo }: TabletLayoutProps) {
  const { isOnline, cola } = useOfflineStore()
  const { usuario } = useAuthStore()
  const { logout } = useAuth()
  const guia = useOnboardingGuide()
  const [menuOpen, setMenuOpen] = useState(false)

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

        <div className="flex items-center gap-2">
          {/* Indicador offline */}
          {!isOnline && (
            <div className="flex items-center gap-1 text-[#BA7517]">
              <WifiOff size={14} />
              {cola.length > 0 && (
                <span className="text-xs font-medium">{cola.length}</span>
              )}
            </div>
          )}

          {/* Menú hamburguesa */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors"
            aria-label="Menú"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Menú desplegable */}
      {menuOpen && (
        <div className="bg-[var(--card-bg)] border-b border-[var(--border)] px-5 py-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#7F77DD]/10 flex items-center justify-center">
                <span className="text-xs font-medium text-[#534AB7]">
                  {usuario?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{usuario?.nombre_completo}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{usuario?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-clay bg-[#E24B4A]/10 text-[#E24B4A] hover:bg-[#E24B4A]/20 transition-colors"
              >
                <LogOut size={14} />
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Botón de soporte flotante */}
      <SupportButton variant="fab" onHelp={guia.abrir} />

      {/* Guía de onboarding */}
      {usuario?.rol && (
        <OnboardingGuide
          rol={usuario.rol as Rol}
          forzar={guia.mostrar}
          onClose={guia.cerrar}
        />
      )}
    </div>
  )
}
