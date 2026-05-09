// src/components/layout/PageLayout.tsx
// Layout desktop: Sidebar + TopBar + contenido
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface PageLayoutProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PageLayout({ title, subtitle, actions, children }: PageLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--page-bg)] transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
