// src/views/auth/ActivateView.tsx
// Pantalla para que el usuario invitado elija su contraseña

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'

export function ActivateView() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)

  // Supabase redirige con tokens en el hash/URL después del click en el link de invitación
  // El cliente de Supabase los detecta automáticamente via detectSessionInUrl: true
  useEffect(() => {
    // Esperar a que Supabase procese los tokens de la URL
    const checkSession = async () => {
      // Dar tiempo a que Supabase procese el hash
      await new Promise((r) => setTimeout(r, 1000))

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setSessionReady(true)
      } else {
        setError('Link de activación inválido o expirado. Pedí una nueva invitación al administrador.')
      }
      setChecking(false)
    }

    checkSession()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      // Redirigir al login después de 2 segundos
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError('Error al configurar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={40} />
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mt-3">WELL LOG</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Activar cuenta</p>
        </div>

        <div className="card-clay p-6">
          {checking ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-[#7F77DD]/20 flex items-center justify-center animate-pulse">
                <span className="text-[#534AB7] text-xs font-semibold">WL</span>
              </div>
              <p className="text-sm text-[var(--text-muted)]">Verificando invitación...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center py-6 gap-4 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-[#1D9E75]" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-medium text-[var(--text-primary)]">¡Cuenta activada!</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Redirigiendo al login...</p>
              </div>
            </div>
          ) : !sessionReady ? (
            <div className="flex flex-col items-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-[#E24B4A]/10 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-medium text-[var(--text-primary)]">Link inválido</h2>
                <p className="text-sm text-[var(--text-muted)] mt-2 max-w-xs">
                  {error || 'El link de activación expiró o ya fue usado. Contactá al administrador para recibir una nueva invitación.'}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
                Ir al login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-base font-medium text-[var(--text-primary)]">Elegí tu contraseña</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Mínimo 8 caracteres. Usá una combinación de letras y números.
                </p>
              </div>

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Input
                label="Confirmar contraseña"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí la contraseña"
                required
              />

              {error && (
                <p className="text-xs text-[#E24B4A] bg-[#E24B4A]/8 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button type="submit" variant="ingreso" size="lg" fullWidth loading={loading}>
                Activar cuenta
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
