// src/components/ui/Drawer.tsx
// Panel lateral deslizable desde la derecha

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  width?: 'sm' | 'md' | 'lg' | 'xl'
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Drawer({ isOpen, onClose, title, subtitle, children, width = 'md' }: DrawerProps) {
  // Cerrar con ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={[
          'relative w-full h-full',
          widthClasses[width],
          'bg-[var(--card-bg)]',
          'shadow-clay-lg',
          'animate-slide-in-right',
          'flex flex-col',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-[var(--divider)] flex-shrink-0">
          <div>
            {title && <h2 className="text-base font-medium text-[var(--text-primary)]">{title}</h2>}
            {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-secondary)] flex-shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
