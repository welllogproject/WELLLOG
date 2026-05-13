import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { Badge } from '@/components/ui/Badge'
import { Search, BookOpen } from 'lucide-react'

const ACCION_CONFIG: Record<string, { label: string; color: string }> = {
  crear_registro:  { label: 'Ingreso',  color: '#1D9E75' },
  editar_registro: { label: 'Edición',  color: '#BA7517' },
  egreso:          { label: 'Egreso',   color: '#7F77DD' },
  anular_registro: { label: 'Anulado',  color: '#E24B4A' },
}

function useLogsAdmin() {
  const { usuario } = useAuthStore()
  return useQuery({
    queryKey: ['logs', 'admin', usuario?.empresa_id, usuario?.rol],
    queryFn: async () => {
      if (!usuario) return []

      let query = supabase
        .from('logs_sistema')
        .select(`
          id, accion, tabla_afectada, registro_id,
          cambios_antes, cambios_despues, ip_origen, created_at,
          usuario:usuarios!logs_sistema_usuario_id_fkey(nombre_completo, email, rol)
        `)
        .order('created_at', { ascending: false })
        .limit(300)

      // Superadmin ve todos; admin solo logs de su empresa
      if (usuario.rol !== 'superadmin') {
        // Filtrar por usuario_id de la empresa
        const { data: uids, error: uidErr } = await supabase
          .from('usuarios')
          .select('id')
          .eq('empresa_id', usuario.empresa_id)
        
        if (uidErr) {
          console.warn('[Logs] Error al obtener usuarios:', uidErr.message)
          return []
        }
        const ids = (uids ?? []).map((u) => u.id)
        if (ids.length === 0) return []
        query = query.in('usuario_id', ids)
      }

      const { data, error } = await query
      if (error) {
        // Si el join falla, intentar sin join
        console.warn('[Logs] Error con join, intentando sin usuario:', error.message)
        let fallbackQuery = supabase
          .from('logs_sistema')
          .select('id, accion, tabla_afectada, registro_id, cambios_antes, cambios_despues, ip_origen, created_at, usuario_id')
          .order('created_at', { ascending: false })
          .limit(300)
        
        if (usuario.rol !== 'superadmin') {
          const { data: uids } = await supabase
            .from('usuarios')
            .select('id')
            .eq('empresa_id', usuario.empresa_id)
          const ids = (uids ?? []).map((u) => u.id)
          if (ids.length === 0) return []
          fallbackQuery = fallbackQuery.in('usuario_id', ids)
        }
        
        const { data: fallbackData, error: err2 } = await fallbackQuery
        if (err2) throw err2
        return (fallbackData ?? []) as any[]
      }
      return (data ?? []) as any[]
    },
    enabled: !!usuario,
    refetchInterval: 60_000,
  })
}

export function Logs() {
  const { data: logs = [], isLoading } = useLogsAdmin()
  const [search, setSearch] = useState('')

  const filtrados = logs.filter((l) => {
    const q = search.toLowerCase()
    return (
      (l.usuario?.nombre_completo ?? '').toLowerCase().includes(q) ||
      (l.usuario?.email ?? '').toLowerCase().includes(q) ||
      (l.accion ?? '').toLowerCase().includes(q) ||
      (l.tabla_afectada ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <PageLayout title="Logs de Auditoría" subtitle="Historial completo de acciones del sistema">
      <div className="relative max-w-xs mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faded)]" />
        <input type="text" placeholder="Buscar por usuario, acción..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15 transition-all"
        />
      </div>

      <div className="card-clay overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--divider)]">
          <BookOpen size={15} className="text-[var(--text-muted)]" />
          <h2 className="text-sm font-medium text-[var(--text-primary)]">
            {filtrados.length} registros
          </h2>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-[#F0F0EE] rounded-[8px] animate-pulse" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[var(--text-muted)]">No hay registros de auditoría</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--divider)]">
                  {['Fecha', 'Usuario', 'Acción', 'Tabla', 'IP'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((log) => {
                  const config = ACCION_CONFIG[log.accion]
                  return (
                    <tr key={log.id} className="border-b border-[var(--divider)] hover:bg-[var(--hover-bg)] transition-colors">
                      <td className="px-4 py-2.5 text-xs font-mono text-[var(--text-secondary)] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-2.5">
                        {log.usuario ? (
                          <div>
                            <p className="text-sm text-[var(--text-primary)]">{log.usuario.nombre_completo}</p>
                            <p className="text-xs text-[var(--text-muted)]">{log.usuario.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">Sistema</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: `${config?.color ?? '#888780'}18`,
                            color: config?.color ?? '#888780',
                          }}>
                          {config?.label ?? log.accion}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-mono text-[var(--text-secondary)]">{log.tabla_afectada ?? '—'}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono text-[var(--text-muted)]">
                        {log.ip_origen ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
