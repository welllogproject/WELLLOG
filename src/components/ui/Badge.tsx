// src/components/ui/Badge.tsx
import type { EstadoEquipo, EstadoIncidente } from '@/types/models'

type BadgeVariant = EstadoEquipo | EstadoIncidente | 'dentro' | 'afuera' | 'warning' | 'danger' | 'info' | 'neutral'

const variantConfig: Record<BadgeVariant, { bg: string; text: string; dot?: string }> = {
  activo:        { bg: 'bg-[#1D9E75]/10', text: 'text-[#0F6E56]', dot: 'bg-[#1D9E75]' },
  mantenimiento: { bg: 'bg-[#BA7517]/10', text: 'text-[#7A4E0F]', dot: 'bg-[#BA7517]' },
  inactivo:      { bg: 'bg-[#888780]/10', text: 'text-[#5F5E5A]', dot: 'bg-[#888780]' },
  pendiente:     { bg: 'bg-[#BA7517]/10', text: 'text-[#7A4E0F]', dot: 'bg-[#BA7517]' },
  investigando:  { bg: 'bg-[#7F77DD]/10', text: 'text-[#534AB7]', dot: 'bg-[#7F77DD]' },
  cerrado:       { bg: 'bg-[#888780]/10', text: 'text-[#5F5E5A]', dot: 'bg-[#888780]' },
  dentro:        { bg: 'bg-[#1D9E75]/10', text: 'text-[#0F6E56]', dot: 'bg-[#1D9E75]' },
  afuera:        { bg: 'bg-[#888780]/10', text: 'text-[#5F5E5A]', dot: 'bg-[#888780]' },
  warning:       { bg: 'bg-[#BA7517]/10', text: 'text-[#7A4E0F]', dot: 'bg-[#BA7517]' },
  danger:        { bg: 'bg-[#E24B4A]/10', text: 'text-[#b93332]', dot: 'bg-[#E24B4A]' },
  info:          { bg: 'bg-[#7F77DD]/10', text: 'text-[#534AB7]', dot: 'bg-[#7F77DD]' },
  neutral:       { bg: 'bg-[#888780]/10', text: 'text-[#5F5E5A]', dot: 'bg-[#888780]' },
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  showDot?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ variant = 'neutral', children, showDot, size = 'md', className = '' }: BadgeProps) {
  const config = variantConfig[variant] ?? variantConfig.neutral
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.bg, config.text,
        className,
      ].join(' ')}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {children}
    </span>
  )
}

// Etiquetas de texto para los valores de badge
export const ESTADO_EQUIPO_LABELS: Record<EstadoEquipo, string> = {
  activo: 'Operativo',
  mantenimiento: 'En Mantenimiento',
  inactivo: 'Inactivo',
}

export const ESTADO_INCIDENTE_LABELS: Record<EstadoIncidente, string> = {
  pendiente: 'Pendiente',
  investigando: 'Investigando',
  cerrado: 'Cerrado',
}
