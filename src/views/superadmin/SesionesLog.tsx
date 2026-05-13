// src/views/superadmin/SesionesLog.tsx
// Historial de sesiones: quién se logueó, cuándo, desde dónde

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageLayout } from '@/components/layout/PageLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Search, LogIn, LogOut, RefreshCw, AlertTriangle, MapPin } from 'lucide-react'

interface SesionLog {
  id: string
  usuario_id: string
  evento: 'login' | 'logout' | 'token_refresh' | 'session_expired'
  ip_origen: string | null
  user_agent: string | null
  latitud: number | null
  longitud: number | null
  created_at: string
  usuario?: { nombre_completo: string; email: string; rol: string } | null
}

function useSesiones() {
  return useQuery({
    queryKey: ['superadmin', 'sesiones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sesiones_log')
        .select(`
          *,
          usuario:usuarios(nombre_completo, email, rol)
        `)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) {
        // Fallback sin join
        const { data: fb, error: err2 } = await supabase
          .from('sesiones_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200)
        if (err2) throw err2
        return (fb ?? []) as SesionLog[]
      }
      return (data ?? []) as SesionLog[]
    },
    refetchInterval: 30_000,
  })
}

const EVENTO_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  login: { icon: <LogIn size={13} />, label: 'Inicio de sesión', color: '#1D9E75' },
  logout: { icon: <LogOut size={13} />, label: 'Cerró sesión', color: '#7F77DD' },
  token_refresh: { icon: <RefreshCw size={13} />, label: 'Token renovado', color: '#BA7517' },
  session_expired: { icon: <AlertTriangle size={13} />, label: 'Sesión expirada', color: '#E24B4A' },
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return '—'
  if (ua.includes('Android')) {
    const match = ua.match(/Android\s([\d.]+)/)
    return `Android ${match?.[1] ?? ''}`
  }
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  return 'Otro'
}

export function SesionesLog() {
  const { data: sesiones = [], isLoading } = useSesiones()
  const [search, setSearch] = useState('')

  const filtradas = sesiones.filter((s) => {
    const q = search.toLowerCase()
    return (
      (s.usuario?.nombre_completo ?? '').toLowerCase().includes(q) ||
      (s.usuario?.email ?? '').toLowerCase().includes(q) ||
      (s.evento ?? '').includes(q)
    )
  })

  // Agrupar por día
  const porDia: Record<string, SesionLog[]> = {}
  filtradas.forEach((s) => {
    const dia = new Date(s.created_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!porDia[dia]) porDia[dia] = []
    porDia[dia].push(s)
  })

  return (
    <PageLayout title="Historial de Sesiones" subtitle="Quién se conectó, cuándo y desde dónde">
      <div className="relative max-w-xs mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faded)]" />
        <input type="text" placeholder="Buscar por nombre o email..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] transition-all"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-[var(--skeleton)] rounded-[10px] animate-pulse" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--text-muted)] text-center py-10">
            Sin registros de sesión. Aparecerán cuando los usuarios inicien sesión.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(porDia).map(([dia, sesionesDelDia]) => (
            <div key={dia}>
              <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">{dia}</h3>
              <Card padding="none">
                <div className="divide-y divide-[var(--divider)]">
                  {sesionesDelDia.map((s) => {
                    const config = EVENTO_CONFIG[s.evento] ?? EVENTO_CONFIG.login
                    return (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors">
                        <div
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                          style={{ background: `${config.color}15`, color: config.color }}
                        >
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {s.usuario?.nombre_completo ?? 'Usuario desconocido'}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {s.usuario?.email ?? '—'} · {s.usuario?.rol ?? '—'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge
                            variant={s.evento === 'login' ? 'activo' : s.evento === 'logout' ? 'info' : s.evento === 'session_expired' ? 'danger' : 'neutral'}
                            size="sm"
                          >
                            {config.label}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[var(--text-faded)]">
                              {new Date(s.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] text-[var(--text-faded)]">
                              {parseUserAgent(s.user_agent)}
                            </span>
                            {s.latitud && s.longitud && (
                              <a
                                href={`https://www.google.com/maps?q=${s.latitud},${s.longitud}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#1D9E75] flex items-center gap-0.5 hover:underline"
                                title={`${s.latitud.toFixed(4)}, ${s.longitud.toFixed(4)}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MapPin size={9} /> Ver mapa
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
