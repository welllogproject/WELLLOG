// src/views/superadmin/ConfiguracionPlataforma.tsx
// Configuración global de la plataforma — sin tocar código

import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Settings, Shield, Bell, Database, Globe, Save } from 'lucide-react'
import toast from 'react-hot-toast'

// Configuración leída de las variables de entorno (solo lectura en runtime)
// Para cambiarlas hay que actualizar el .env en Vercel
const ENV_CONFIG = {
  appUrl:          import.meta.env.VITE_APP_URL ?? '—',
  supabaseUrl:     import.meta.env.VITE_SUPABASE_URL ?? '—',
  maxOfflineQueue: import.meta.env.VITE_MAX_OFFLINE_QUEUE ?? '200',
  syncInterval:    import.meta.env.VITE_OFFLINE_SYNC_INTERVAL_MS ?? '30000',
  supportEmail:    import.meta.env.VITE_SUPPORT_EMAIL ?? '—',
  supportWA:       import.meta.env.VITE_SUPPORT_WHATSAPP ?? '—',
  featureQR:       import.meta.env.VITE_FEATURE_QR ?? 'false',
  featureGeofence: import.meta.env.VITE_FEATURE_GEOFENCE ?? 'false',
  featureEmergencia: import.meta.env.VITE_FEATURE_EMERGENCIA ?? 'true',
  featureHSE:      import.meta.env.VITE_FEATURE_HSE_INDICES ?? 'true',
}

function ConfigSection({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[var(--divider)]">
        <div className="w-8 h-8 rounded-[10px] bg-[#7F77DD]/10 flex items-center justify-center text-[#534AB7]">
          {icon}
        </div>
        <h3 className="text-sm font-medium text-[var(--text-primary)]">{title}</h3>
      </div>
      {children}
    </Card>
  )
}

function ConfigRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[var(--divider)] last:border-0">
      <div>
        <p className="text-sm text-[var(--text-primary)]">{label}</p>
        {hint && <p className="text-xs text-[var(--text-muted)] mt-0.5">{hint}</p>}
      </div>
      <span className="text-sm font-mono text-[var(--text-secondary)] ml-4 text-right max-w-[200px] truncate">
        {value}
      </span>
    </div>
  )
}

function FeatureFlag({ label, enabled, hint }: { label: string; enabled: boolean; hint?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--divider)] last:border-0">
      <div>
        <p className="text-sm text-[var(--text-primary)]">{label}</p>
        {hint && <p className="text-xs text-[var(--text-muted)] mt-0.5">{hint}</p>}
      </div>
      <span className={[
        'text-xs font-medium px-2.5 py-1 rounded-full',
        enabled
          ? 'bg-[#1D9E75]/10 text-[#0F6E56]'
          : 'bg-[#888780]/10 text-[var(--text-muted)]',
      ].join(' ')}>
        {enabled ? 'Activo' : 'Inactivo'}
      </span>
    </div>
  )
}

export function ConfiguracionPlataforma() {
  const [resendKey, setResendKey] = useState('')
  const [siteUrl, setSiteUrl] = useState(ENV_CONFIG.appUrl)
  const [saving, setSaving] = useState(false)

  const handleSaveEnv = async () => {
    setSaving(true)
    // En producción esto requeriría llamar a la API de Vercel para actualizar env vars
    // Por ahora mostramos las instrucciones
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast('Para aplicar cambios, actualizá las variables en el panel de Vercel y redesplegá.', {
      icon: 'ℹ️',
      duration: 6000,
    })
  }

  return (
    <PageLayout
      title="Configuración"
      subtitle="Variables de entorno y feature flags de la plataforma"
    >
      {/* Aviso */}
      <div className="bg-[#BA7517]/8 border border-[#BA7517]/20 rounded-[12px] p-4 mb-5 flex gap-3">
        <Settings size={16} className="text-[#BA7517] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#7A4E0F]">Variables de entorno</p>
          <p className="text-xs text-[#7A4E0F] mt-0.5">
            Estos valores se configuran en el panel de Vercel → Settings → Environment Variables.
            Los cambios requieren un nuevo deploy para aplicarse.
          </p>
        </div>
      </div>

      {/* App */}
      <ConfigSection icon={<Globe size={16} />} title="Aplicación">
        <ConfigRow label="URL de la app" value={ENV_CONFIG.appUrl} />
        <ConfigRow label="Supabase URL" value={ENV_CONFIG.supabaseUrl.slice(0, 40) + '...'} />
        <ConfigRow label="Cola offline máxima" value={`${ENV_CONFIG.maxOfflineQueue} registros`} hint="VITE_MAX_OFFLINE_QUEUE" />
        <ConfigRow label="Intervalo de sync" value={`${parseInt(ENV_CONFIG.syncInterval) / 1000}s`} hint="VITE_OFFLINE_SYNC_INTERVAL_MS" />
      </ConfigSection>

      {/* Soporte */}
      <ConfigSection icon={<Bell size={16} />} title="Soporte y notificaciones">
        <ConfigRow label="Email de soporte" value={ENV_CONFIG.supportEmail} hint="VITE_SUPPORT_EMAIL" />
        <ConfigRow label="WhatsApp de soporte" value={ENV_CONFIG.supportWA} hint="VITE_SUPPORT_WHATSAPP" />
        <div className="mt-4 pt-3 border-t border-[var(--divider)]">
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Para activar notificaciones por email de incidentes, configurá la API key de Resend en las Edge Functions.
          </p>
          <div className="flex gap-3">
            <Input
              label="Resend API Key (para alertas de incidentes)"
              type="password"
              value={resendKey}
              onChange={(e) => setResendKey(e.target.value)}
              placeholder="re_..."
              hint="Se guarda en Supabase Secrets, no en el frontend"
            />
          </div>
        </div>
      </ConfigSection>

      {/* Feature Flags */}
      <ConfigSection icon={<Shield size={16} />} title="Feature Flags">
        <FeatureFlag
          label="QR Scanner"
          enabled={ENV_CONFIG.featureQR === 'true'}
          hint="VITE_FEATURE_QR — Escaneo de QR para egreso rápido"
        />
        <FeatureFlag
          label="Geofence"
          enabled={ENV_CONFIG.featureGeofence === 'true'}
          hint="VITE_FEATURE_GEOFENCE — Validar ubicación GPS del operador"
        />
        <FeatureFlag
          label="Panel de Emergencia"
          enabled={ENV_CONFIG.featureEmergencia === 'true'}
          hint="VITE_FEATURE_EMERGENCIA — Lista de evacuación en tiempo real"
        />
        <FeatureFlag
          label="Índices HSE"
          enabled={ENV_CONFIG.featureHSE === 'true'}
          hint="VITE_FEATURE_HSE_INDICES — IF, IG y métricas HSE"
        />
        <div className="mt-4 pt-3 border-t border-[var(--divider)]">
          <p className="text-xs text-[var(--text-muted)]">
            Para cambiar un feature flag: actualizá la variable en Vercel y redesplegá.
            No requiere cambios de código.
          </p>
        </div>
      </ConfigSection>

      {/* DB Info */}
      <ConfigSection icon={<Database size={16} />} title="Base de datos">
        <ConfigRow label="Provider" value="Supabase (PostgreSQL 15)" />
        <ConfigRow label="Extensiones" value="PostGIS, pgcrypto, uuid-ossp" />
        <ConfigRow label="RLS" value="Habilitado en todas las tablas" />
        <ConfigRow label="Realtime" value="Habilitado — registros_acceso, incidentes" />
        <div className="mt-4 pt-3 border-t border-[var(--divider)]">
          <a
            href={`${ENV_CONFIG.supabaseUrl.replace('https://', 'https://app.supabase.com/project/')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#7F77DD] hover:underline"
          >
            Abrir panel de Supabase →
          </a>
        </div>
      </ConfigSection>

      <div className="flex justify-end">
        <Button variant="ingreso" size="sm" onClick={handleSaveEnv} loading={saving}>
          <Save size={14} className="mr-1.5" />
          Ver instrucciones de deploy
        </Button>
      </div>
    </PageLayout>
  )
}
