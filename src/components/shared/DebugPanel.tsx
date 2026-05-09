import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

interface ProbeResult {
  table: string
  count: number | null
  error: string | null
  sample: unknown
}

const TABLAS = [
  'empresas',
  'usuarios',
  'equipos',
  'locaciones',
  'registros_acceso',
  'incidentes',
  'documentos_seguridad',
  'permisos_acceso',
  'metricas_diarias',
  'logs_sistema',
]

export function DebugPanel() {
  const { usuario } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<ProbeResult[]>([])
  const [session, setSession] = useState<unknown>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('debug') === '1') setOpen(true)
  }, [])

  async function probar() {
    setRunning(true)
    const { data: s } = await supabase.auth.getSession()
    setSession(s.session)

    const probes: ProbeResult[] = []
    for (const t of TABLAS) {
      const { data, count, error } = await supabase
        .from(t)
        .select('*', { count: 'exact' })
        .limit(1)
      probes.push({
        table: t,
        count: count ?? null,
        error: error?.message ?? null,
        sample: data?.[0] ?? null,
      })
    }
    setResults(probes)
    setRunning(false)
  }

  if (!open) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[420px] max-h-[80vh] overflow-y-auto bg-black/95 text-white text-xs font-mono rounded-lg shadow-2xl border border-white/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">🔧 Debug Panel</span>
        <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>

      <div className="mb-3 space-y-1 border-b border-white/20 pb-2">
        <div><span className="opacity-60">user:</span> {usuario?.nombre_completo ?? '—'}</div>
        <div><span className="opacity-60">id:</span> {usuario?.id ?? '—'}</div>
        <div><span className="opacity-60">rol:</span> {usuario?.rol ?? '—'}</div>
        <div><span className="opacity-60">empresa_id:</span> {usuario?.empresa_id ?? '—'}</div>
        <div><span className="opacity-60">estado:</span> {usuario?.estado ?? '—'}</div>
        <div><span className="opacity-60">session:</span> {session ? 'activa' : 'nada'}</div>
      </div>

      <button
        onClick={probar}
        disabled={running}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-3 py-1.5 rounded mb-2"
      >
        {running ? 'Probando...' : 'Probar todas las tablas'}
      </button>

      <div className="space-y-1">
        {results.map((r) => (
          <div
            key={r.table}
            className={`px-2 py-1 rounded ${r.error ? 'bg-red-900/40' : r.count === 0 ? 'bg-yellow-900/40' : 'bg-green-900/30'}`}
          >
            <div className="flex justify-between">
              <span className="font-bold">{r.table}</span>
              <span>{r.error ? 'ERR' : `${r.count} rows`}</span>
            </div>
            {r.error && <div className="text-red-300 mt-0.5">{r.error}</div>}
          </div>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t border-white/20 opacity-60 text-[10px]">
        En DevTools console: <code className="bg-white/10 px-1">__supabase</code>
      </div>
    </div>
  )
}
