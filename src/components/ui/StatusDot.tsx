// src/components/ui/StatusDot.tsx
// Indicador de estado visual con pulse animation

type StatusColor = 'green' | 'amber' | 'gray' | 'red'

interface StatusDotProps {
  color: StatusColor
  pulse?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const colorClasses: Record<StatusColor, string> = {
  green: 'bg-[#1D9E75]',
  amber: 'bg-[#BA7517]',
  gray:  'bg-[#888780]',
  red:   'bg-[#E24B4A]',
}

const pulseClasses: Record<StatusColor, string> = {
  green: 'bg-[#1D9E75]/30',
  amber: 'bg-[#BA7517]/30',
  gray:  'bg-[#888780]/30',
  red:   'bg-[#E24B4A]/30',
}

const sizeClasses = {
  sm:  'w-2 h-2',
  md:  'w-2.5 h-2.5',
  lg:  'w-3.5 h-3.5',
}

export function StatusDot({ color, pulse, size = 'md', className = '' }: StatusDotProps) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      {pulse && (
        <span
          className={`absolute inline-flex rounded-full ${sizeClasses[size]} ${pulseClasses[color]} animate-ping opacity-75`}
        />
      )}
      <span className={`relative inline-flex rounded-full ${sizeClasses[size]} ${colorClasses[color]}`} />
    </span>
  )
}
