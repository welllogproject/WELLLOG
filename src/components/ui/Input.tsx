// src/components/ui/Input.tsx
import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  variant?: 'default' | 'numeric-large'
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, variant = 'default', icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">
            {label}
            {props.required && <span className="text-[#E24B4A] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full bg-[var(--card-bg)] text-[var(--text-primary)] border rounded-clay-sm outline-none transition-all duration-150',
              'placeholder:text-[var(--text-faded)]',
              error
                ? 'border-[#E24B4A] focus:border-[#E24B4A] focus:ring-2 focus:ring-[#E24B4A]/20'
                : 'border-[var(--border-strong)] focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15',
              variant === 'numeric-large'
                ? 'text-4xl font-medium text-center tracking-widest py-5 px-4'
                : `text-sm py-2.5 ${icon ? 'pl-10 pr-4' : 'px-4'}`,
              className,
            ].join(' ')}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#E24B4A]">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// Select genérico
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className = '', id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">
          {label}
          {props.required && <span className="text-[#E24B4A] ml-0.5">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={[
          'w-full bg-[var(--card-bg)] border rounded-clay-sm text-sm py-2.5 px-4 outline-none transition-all duration-150 appearance-none cursor-pointer',
          error
            ? 'border-[#E24B4A] focus:border-[#E24B4A]'
            : 'border-[var(--border-strong)] focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15',
          'text-[var(--text-primary)]',
          className,
        ].join(' ')}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[#E24B4A]">{error}</p>}
    </div>
  )
}
