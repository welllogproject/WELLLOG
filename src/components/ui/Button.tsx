// src/components/ui/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'ingreso' | 'salida' | 'secondary' | 'ghost' | 'danger' | 'primary'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  ingreso: 'btn-ingreso font-medium rounded-clay shadow-clay-sm',
  salida: 'btn-salida font-medium rounded-clay shadow-clay-sm',
  primary: 'btn-ingreso font-medium rounded-clay shadow-clay-sm',
  secondary: 'bg-[var(--card-bg)] border border-[var(--border-strong)] text-[var(--text-primary)] font-medium rounded-clay hover:bg-[var(--hover-bg)] transition-all duration-150',
  ghost: 'bg-transparent text-[var(--text-secondary)] font-medium rounded-clay hover:bg-[var(--hover-bg)] transition-all duration-150',
  danger: 'btn-peligro font-medium rounded-clay shadow-clay-sm',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-5 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, icon, children, disabled, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          'inline-flex items-center justify-center gap-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          'select-none',
          className,
        ].join(' ')}
        {...props}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
