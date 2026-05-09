// src/components/layout/PageLayout.tsx
// Layout desktop/móvil: Sidebar colapsable + TopBar + contenido
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { OnboardingGuide, useOnboardingGuide } from '@/components/shared/OnboardingGuide'
import { useAuthStore } from '@/stores/authStore'
import type { Rol } from '@/types/roles'

interface PageLayoutProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PageLayout({ title, subtitle, actions, children }: PageLayoutProps) {
  const { usuario } = useAuthStore()
  const guia = useOnboardingGuide()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--page-bg)] transition-colors duration-200">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar
          title={title}
          subtitle={subtitle}
          actions={actions}
          onHelp={guia.abrir}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

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
