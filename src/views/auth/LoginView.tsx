// src/views/auth/LoginView.tsx
import { useState, FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

function WellLogIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wl-login-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7F77DD" />
          <stop offset="100%" stopColor="#534AB7" />
        </linearGradient>
      </defs>
      <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" fill="url(#wl-login-grad)" />
      <rect x="15" y="7" width="2" height="12" rx="1" fill="white" opacity="0.95" />
      <path d="M11 17 L16 22 L21 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="13" y="6" width="6" height="2" rx="1" fill="white" opacity="0.7" />
    </svg>
  )
}

export function LoginView() {
  const { usuario, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirigir si ya está autenticado
  if (!isLoading && usuario) {
    if (usuario.rol === 'superadmin') return <Navigate to="/superadmin" replace />
    if (usuario.rol === 'operador')   return <Navigate to="/operador" replace />
    if (usuario.rol === 'auditor')    return <Navigate to="/auditor" replace />
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Completá email y contraseña')
      return
    }

    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (authError) {
        setError('Credenciales inválidas. Verificá tu email y contraseña.')
      }
    } catch {
      toast.error('Error de conexión. Verificá tu conexión a internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center p-4 transition-colors duration-200">
      {/* Theme toggle esquina */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Card login */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <WellLogIcon size={56} />
          <div className="text-center">
            <h1 className="text-xl font-medium text-[var(--text-primary)]">WELL LOG</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Control de acceso en campo</p>
          </div>
        </div>

        {/* Form */}
        <div className="card-clay p-6">
          <h2 className="text-base font-medium text-[#2C2C2A] mb-5">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              autoComplete="email"
              required
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-[var(--text-primary)]">
                Contraseña <span className="text-[#E24B4A]">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border)] rounded-clay-sm text-sm py-2.5 px-4 pr-10 outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15 transition-all placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#5F5E5A] transition-colors"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#E24B4A]/8 text-[#b93332] text-sm px-3 py-2.5 rounded-clay-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="ingreso"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              Ingresar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-5">
          ¿Problemas para acceder? Contactá al administrador de tu empresa.
        </p>
      </div>
    </div>
  )
}
