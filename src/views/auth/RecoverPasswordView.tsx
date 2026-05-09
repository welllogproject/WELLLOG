// src/views/auth/RecoverPasswordView.tsx
// Recuperación de contraseña — envía magic link por email

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Logo } from '@/components/ui/Logo'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

export function RecoverPasswordView() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Ingresá tu email'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email inválido'); return }

    setLoading(true)
    setError('')

    const { error: supaErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    setLoading(false)

    if (supaErr) {
      // No revelar si el email existe o no — siempre mostrar éxito
      console.error('[recover]', supaErr.message)
    }

    // Siempre mostrar éxito para no revelar qué emails están registrados
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={48} className="mb-3" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">WELL LOG</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Recuperar contraseña</p>
        </div>

        <div className="card-clay p-6">
          {!sent ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Ingresá tu email y te enviamos un link para restablecer tu contraseña.
                </p>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="tu@empresa.com"
                  error={error}
                  autoFocus
                  required
                />
              </div>

              <Button
                type="submit"
                variant="ingreso"
                size="md"
                fullWidth
                loading={loading}
              >
                Enviar link de recuperación
              </Button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft size={14} />
                Volver al login
              </Link>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-[#1D9E75]" />
              </div>
              <div>
                <h3 className="text-base font-medium text-[var(--text-primary)]">Revisá tu email</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  Si <span className="font-medium">{email}</span> está registrado, vas a recibir un link para restablecer tu contraseña.
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Revisá también la carpeta de spam.
                </p>
              </div>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm text-[#7F77DD] hover:underline mt-2"
              >
                <ArrowLeft size={14} />
                Volver al login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
