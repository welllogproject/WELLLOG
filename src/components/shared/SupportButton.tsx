// src/components/shared/SupportButton.tsx
// Botón de soporte flotante — visible para todos los roles
// Configurable via VITE_SUPPORT_EMAIL y VITE_SUPPORT_WHATSAPP

import { useState } from 'react'
import { HelpCircle, X, Mail, MessageCircle, ExternalLink, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL as string | undefined
const SUPPORT_WA = import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined

// Construye el link de WhatsApp con mensaje pre-cargado
function buildWhatsAppLink(phone: string, mensaje: string) {
  const num = phone.replace(/\D/g, '')
  return `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`
}

// Construye el mailto con asunto y cuerpo pre-cargados
function buildMailtoLink(email: string, asunto: string, cuerpo: string) {
  return `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
}

interface SupportButtonProps {
  variant?: 'fab' | 'icon'
  onHelp?: () => void
}

export function SupportButton({ variant = 'icon', onHelp }: SupportButtonProps) {
  const [open, setOpen] = useState(false)
  const { usuario } = useAuthStore()

  // No mostrar si no hay ningún canal de soporte configurado
  if (!SUPPORT_EMAIL && !SUPPORT_WA) return null

  const asunto = `[WELL LOG] Soporte — ${usuario?.nombre_completo ?? 'Usuario'}`
  const cuerpo = [
    `Hola, necesito ayuda con WELL LOG.`,
    ``,
    `Usuario: ${usuario?.nombre_completo ?? '—'}`,
    `Email: ${usuario?.email ?? '—'}`,
    `Rol: ${usuario?.rol ?? '—'}`,
    `Empresa ID: ${usuario?.empresa_id ?? '—'}`,
    ``,
    `Descripción del problema:`,
    `[Describí acá lo que pasó]`,
  ].join('\n')

  const mensajeWA = [
    `Hola, necesito ayuda con WELL LOG.`,
    `Usuario: ${usuario?.nombre_completo ?? '—'} (${usuario?.rol ?? '—'})`,
    `Problema: `,
  ].join('\n')

  return (
    <>
      {/* Botón */}
      {variant === 'fab' ? (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          {/* Botón de ayuda */}
          {onHelp && (
            <button
              onClick={onHelp}
              className="w-10 h-10 rounded-full shadow-clay flex items-center justify-center bg-[var(--card-bg)] border border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[#7F77DD] transition-all active:scale-95"
              aria-label="Guía de uso"
              title="¿Cómo se usa?"
            >
              <BookOpen size={18} />
            </button>
          )}
          {/* Botón de soporte */}
          <button
            onClick={() => setOpen(true)}
            className="w-12 h-12 rounded-full shadow-clay flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'var(--btn-ingreso)' }}
            aria-label="Soporte"
            title="¿Necesitás ayuda?"
          >
            <HelpCircle size={22} className="text-white" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Soporte"
          title="¿Necesitás ayuda?"
        >
          <HelpCircle size={17} />
        </button>
      )}

      {/* Modal de soporte */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-sm bg-[var(--card-bg)] rounded-t-[24px] sm:rounded-[24px] shadow-clay-lg animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--divider)]">
              <div>
                <h2 className="text-base font-medium text-[var(--text-primary)]">¿Necesitás ayuda?</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Contactá al equipo de soporte de WELL LOG</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Opciones */}
            <div className="p-5 space-y-3">
              {SUPPORT_WA && (
                <a
                  href={buildWhatsAppLink(SUPPORT_WA, mensajeWA)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-[14px] border border-[var(--border)] hover:border-[#1D9E75]/40 hover:bg-[#1D9E75]/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#1D9E75]/20 transition-colors">
                    <MessageCircle size={20} className="text-[#1D9E75]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">WhatsApp</p>
                    <p className="text-xs text-[var(--text-muted)]">Respuesta rápida en horario laboral</p>
                  </div>
                  <ExternalLink size={14} className="text-[var(--text-faded)] flex-shrink-0" />
                </a>
              )}

              {SUPPORT_EMAIL && (
                <a
                  href={buildMailtoLink(SUPPORT_EMAIL, asunto, cuerpo)}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-[14px] border border-[var(--border)] hover:border-[#7F77DD]/40 hover:bg-[#7F77DD]/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#7F77DD]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#7F77DD]/20 transition-colors">
                    <Mail size={20} className="text-[#7F77DD]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Email</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{SUPPORT_EMAIL}</p>
                  </div>
                  <ExternalLink size={14} className="text-[var(--text-faded)] flex-shrink-0" />
                </a>
              )}

              {/* Info del usuario para el soporte */}
              <div className="bg-[var(--input-bg)] rounded-[10px] px-4 py-3 mt-2">
                <p className="text-[10px] text-[var(--text-faded)] uppercase tracking-wide mb-1.5">
                  Se incluirá automáticamente
                </p>
                <div className="space-y-0.5">
                  <p className="text-xs text-[var(--text-secondary)]">
                    <span className="text-[var(--text-muted)]">Usuario:</span> {usuario?.nombre_completo ?? '—'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    <span className="text-[var(--text-muted)]">Rol:</span> {usuario?.rol ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
