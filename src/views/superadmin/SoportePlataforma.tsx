// src/views/superadmin/SoportePlataforma.tsx
// Panel de soporte — ver tickets, impersonar empresa, health check

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTodasEmpresas } from '@/hooks/useEmpresas'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  Activity, CheckCircle2, XCircle, AlertTriangle,
  Eye, RefreshCw, Database, Wifi, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Health Check ───────────────────────────────────────────
function useHealthCheck() {
  return useQuery({
    queryKey: ['superadmin', 'health'],
    queryFn: async () => {
      const start = Date.now()
      const checks = await Promise.allSettled([
        // DB: query simple
        supabase.from('empresas').select('id', { count: 'exact', head: true }),
        // Auth: sesión activa
        supabase.auth.getSession(),
        // Realtime: estado de la conexión
        Promise.resolve(supabase.realtime.isConnected()),
      ])

      const latencia = Date.now() - start

      return {
        db: checks[0].status === 'fulfilled' && !(checks[0].value as any).error,
        auth: checks[1].status === 'fulfilled',
        realtime: checks[2].status === 'fulfilled' && checks[2].value === true,
        latencia,
        timestamp: new Date().toISOString(),
      }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

// ── Actividad reciente por empresa ─────────────────────────
function useActividadEmpresas() {
  return useQuery({
    queryKey: ['superadmin', 'actividad-empresas'],
    queryFn: async () => {
      const hace7 = new Date()
      hace7.setDate(hace7.getDate() - 7)

      const { data } = await supabase
        .from('registros_acceso')
        .select(`
          equipo:equipos!inner(empresa_contratista_id,
            empresa:empresas!empresa_contratista_id(id, nombre))
        `)
        .gte('fecha_ingreso', hace7.toISOString())
        .is('deleted_at', null)

      const map: Record<string, { nombre: string; registros: number }> = {}
      ;(data ?? []).forEach((r: any) => {
        const id = r.equipo?.empresa_contratista_id
        const nombre = r.equipo?.empresa?.nombre ?? 'Desconocida'
        if (!map[id]) map[id] = { nombre, registros: 0 }
        map[id].registros++
      })

      return Object.entries(map)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.registros - a.registros)
    },
    staleTime: 1000 * 60 * 5,
  })
}

// ── Últimos errores de sync offline ───────────────────────
function useErroresSync() {
  return useQuery({
    queryKey: ['superadmin', 'errores-sync'],
    queryFn: async () => {
      const { data } = await supabase
        .from('logs_sistema')
        .select('id, accion, cambios_despues, created_at, usuario:usuarios(nombre_completo, email)')
        .eq('accion', 'sync_error')
        .order('created_at', { ascending: false })
        .limit(20)
      return data ?? []
    },
  })
}

export function SoportePlataforma() {
  const { data: health, isLoading: loadingHealth, refetch: refetchHealth } = useHealthCheck()
  const { data: actividad = [], isLoading: loadingActividad } = useActividadEmpresas()
  const { data: errores = [] } = useErroresSync()
  const { data: empresas = [] } = useTodasEmpresas()

  const [impersonarModal, setImpersonarModal] = useState(false)
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('')

  const handleImpersonar = () => {
    if (!empresaSeleccionada) return
    const empresa = empresas.find(e => e.id === empresaSeleccionada)
    toast(`Función de impersonación requiere Edge Function con service role. Empresa: ${empresa?.nombre}`, {
      icon: 'ℹ️',
      duration: 5000,
    })
    setImpersonarModal(false)
  }

  const StatusIcon = ({ ok }: { ok: boolean }) =>
    ok
      ? <CheckCircle2 size={16} className="text-[#1D9E75]" />
      : <XCircle size={16} className="text-[#E24B4A]" />

  return (
    <PageLayout title="Soporte" subtitle="Estado del sistema y herramientas de diagnóstico">

      {/* ── Health Check ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
              <Activity size={15} className="text-[var(--text-muted)]" />
              Estado del sistema
            </h3>
            <button
              onClick={() => refetchHealth()}
              className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors"
              title="Actualizar"
            >
              <RefreshCw size={14} className={loadingHealth ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingHealth ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-8 bg-[var(--skeleton)] rounded-[8px] animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[var(--divider)]">
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-primary)]">Base de datos</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon ok={health?.db ?? false} />
                  <span className="text-xs text-[var(--text-muted)]">{health?.latencia}ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[var(--divider)]">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-primary)]">Autenticación</span>
                </div>
                <StatusIcon ok={health?.auth ?? false} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Wifi size={14} className="text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-primary)]">Realtime</span>
                </div>
                <StatusIcon ok={health?.realtime ?? false} />
              </div>
              {health?.timestamp && (
                <p className="text-[10px] text-[var(--text-faded)] flex items-center gap-1 pt-1">
                  <Clock size={10} />
                  Última verificación: {new Date(health.timestamp).toLocaleTimeString('es-AR')}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* ── Impersonar empresa ── */}
        <Card>
          <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2 mb-4">
            <Eye size={15} className="text-[var(--text-muted)]" />
            Ver como empresa
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Accedé al dashboard de una empresa específica para diagnosticar problemas sin necesitar sus credenciales.
          </p>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => setImpersonarModal(true)}
          >
            <Eye size={14} className="mr-1.5" />
            Seleccionar empresa
          </Button>
          <p className="text-[10px] text-[var(--text-faded)] mt-3 text-center">
            Requiere Edge Function con service role (pendiente de implementar)
          </p>
        </Card>
      </div>

      {/* ── Actividad por empresa (últimos 7 días) ── */}
      <Card className="mb-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
          Actividad por empresa — últimos 7 días
        </h3>
        {loadingActividad ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-[var(--skeleton)] rounded-[8px] animate-pulse" />)}
          </div>
        ) : actividad.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">Sin actividad en los últimos 7 días</p>
        ) : (
          <div className="space-y-2">
            {actividad.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-3 py-2.5 rounded-[10px] hover:bg-[var(--hover-bg)] transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#7F77DD]/10 flex items-center justify-center text-xs font-semibold text-[#534AB7]">
                    {a.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-[var(--text-primary)]">{a.nombre}</span>
                </div>
                <Badge variant="info" size="sm">{a.registros} registros</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Errores de sync ── */}
      {errores.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-[#E24B4A]" />
            Errores de sincronización offline
          </h3>
          <div className="space-y-2">
            {errores.map((e: any) => (
              <div key={e.id} className="flex items-start gap-3 px-3 py-2.5 rounded-[10px] bg-[#E24B4A]/5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    {(e.usuario as any)?.nombre_completo ?? 'Sistema'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {JSON.stringify(e.cambios_despues).slice(0, 80)}...
                  </p>
                </div>
                <span className="text-[10px] text-[var(--text-faded)] flex-shrink-0">
                  {new Date(e.created_at).toLocaleDateString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal impersonar */}
      <Modal isOpen={impersonarModal} onClose={() => setImpersonarModal(false)} title="Ver como empresa" size="sm">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Seleccioná la empresa que querés ver. Se abrirá su dashboard en modo solo lectura.
        </p>
        <select
          value={empresaSeleccionada}
          onChange={(e) => setEmpresaSeleccionada(e.target.value)}
          className="w-full py-2.5 px-4 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] mb-4"
        >
          <option value="">Seleccionar empresa...</option>
          {empresas.filter(e => e.tipo === 'contratista').map(e => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" fullWidth onClick={() => setImpersonarModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="ingreso"
            size="sm"
            fullWidth
            disabled={!empresaSeleccionada}
            onClick={handleImpersonar}
          >
            <Eye size={14} className="mr-1.5" />
            Ver empresa
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
