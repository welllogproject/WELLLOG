import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/8 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ${className}`}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
