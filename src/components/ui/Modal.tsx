// src/components/ui/Modal.tsx
import { useEffect, ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  hideClose?: boolean
}

const sizeClasses = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-4xl',
}

export function Modal({ isOpen, onClose, title, children, size = 'md', hideClose }: ModalProps) {
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={[
          'relative w-full',
          sizeClasses[size],
          'bg-white rounded-t-[24px] sm:rounded-[24px]',
          'shadow-clay-lg',
          'animate-slide-up',
          'max-h-[92vh] overflow-y-auto',
        ].join(' ')}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-center justify-between p-5 pb-4 border-b border-[rgba(0,0,0,0.06)]">
            {title && (
              <h2 className="text-base font-medium text-[#2C2C2A]">{title}</h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                className="ml-auto p-1.5 rounded-full hover:bg-black/5 transition-colors text-[#5F5E5A]"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
