import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

interface ProbeResult {
  table: string
  count: number | null
  error: string | null
}

const TABLAS = [
  'empresas', 'usuarios', 'equipos', 'locaciones',
  'registros_acceso', 'incidentes', 'documentos_seguridad',
  'permisos_acceso', 'metricas_diarias', 'logs_sistema',
]

const IS_DEV = import.meta.env.DEV

export function DebugPanel() {
  const { usuario } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<ProbeResult[]>([])
  const [session, setSession] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  // Solo disponible en dev o para superadmin con ?debug=1
  const canOpen = IS_DEV || usuario?.rol === 'superadmin'

  useEffect(() => {
    if (!canOpen) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('debug') === '1') setOpen(true)
  }, [canOpen])

  async function probar() {
    setRunning(true)
    const { data: s } = await supabase.auth.getSession()
    setSession(s.session ? `${s.session.user.email} (${s.session.expires_at})` : null)

    // Paralelo — mucho más rápido que serial
    const probes = await Promise.all(
      TABLAS.map(async (t) => {
        const { count, error } = await supabase
          .from(t)
          .select('*', { count: 'exact', head: true })
        return {
          table: t,
          count: count ?? null,
          error: error?.message ?? null,
        }
      })
    )
    setResults(probes)
    setRunning(false)
  }

  if (!canOpen || !open) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[400px] max-h-[80vh] overflow-y-auto bg-black/95 text-white text-xs font-mono rounded-xl shadow-2xl border border-white/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-[11px]">🔧 Debug Panel {IS_DEV ? '(dev)' : '(superadmin)'}</span>
        <button onClick={() => setOpen(false)} className="opacity-60 hover:opacity-100 text-base leading-none">✕</button>
      </div>

      <div className="mb-3 space-y-0.5 border-b border-white/20 pb-2 text-[10px]">
        <div><span className="opacity-50">user:</span> {usuario?.nombre_completo ?? '—'}</div>
        <div><span className="opacity-50">rol:</span> {usuario?.rol ?? '—'}</div>
        <div><span className="opacity-50">empresa_id:</span> {usuario?.empresa_id ?? '—'}</div>
        <div><span className="opacity-50">session:</span> {session ?? 'no session'}</div>
      </div>

      <button
        onClick={probar}
        disabled={running}
        className="w-full bg-[#7F77DD] hover:bg-[#534AB7] disabled:opacity-50 px-3 py-1.5 rounded-lg mb-2 text-[11px] font-medium transition-colors"
      >
        {running ? 'Probando...' : 'Probar todas las tablas (paralelo)'}
      </button>

      <div className="space-y-1">
        {results.map((r) => (
          <div
            key={r.table}
            className={`px-2 py-1 rounded-lg flex items-center justify-between ${
              r.error ? 'bg-red-900/50' : r.count === 0 ? 'bg-yellow-900/40' : 'bg-green-900/30'
            }`}
          >
            <span className="font-medium">{r.table}</span>
            <span className={r.error ? 'text-red-300' : r.count === 0 ? 'text-yellow-300' : 'text-green-300'}>
              {r.error ? `ERR: ${r.error.slice(0, 30)}` : `${r.count} rows`}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t border-white/20 opacity-50 text-[10px]">
        DevTools: <code className="bg-white/10 px-1 rounded">__supabase</code>
      </div>
    </div>
  )
}
