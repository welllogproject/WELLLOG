// src/views/superadmin/LogsGlobales.tsx
// Logs de auditoría de toda la plataforma — superadmin only

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTodasEmpresas } from '@/hooks/useEmpresas'
import { PageLayout } from '@/components/layout/PageLayout'
import { Search, BookOpen, Download } from 'lucide-react'

const ACCION_CONFIG: Record<string, { label: string; color: string }> = {
  crear_registro:    { label: 'Ingreso',    color: '#1D9E75' },
  editar_registro:   { label: 'Edición',    color: '#BA7517' },
  egreso:            { label: 'Egreso',     color: '#7F77DD' },
  anular_registro:   { label: 'Anulado',    color: '#E24B4A' },
  alerta_incidente:  { label: 'Alerta',     color: '#E24B4A' },
  sync_error:        { label: 'Sync Error', color: '#E24B4A' },
  login:             { label: 'Login',      color: '#534AB7' },
  logout:            { label: 'Logout',     color: '#888780' },
}

function useLogsGlobales(empresaId: string, accion: string) {
  return useQuery({
    queryKey: ['superadmin', 'logs', empresaId, accion],
    queryFn: async () => {
      let query = supabase
        .from('logs_sistema')
        .select(`
          id, accion, tabla_afectada, registro_id,
          ip_origen, created_at,
          usuario:usuarios(nombre_completo, email, rol, empresa_id,
            empresa:empresas(nombre))
        `)
        .order('created_at', { ascending: false })
        .limit(500)

      if (empresaId) {
        // Filtrar por empresa via subquery de usuarios
        const { data: uids } = await supabase
          .from('usuarios')
          .select('id')
          .eq('empresa_id', empresaId)
        const ids = (uids ?? []).map(u => u.id)
        if (ids.length > 0) query = query.in('usuario_id', ids)
        else return []
      }

      if (accion) query = query.eq('accion', accion)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as any[]
    },
  })
}

function exportCSV(logs: any[]) {
  const headers = ['Fecha', 'Usuario', 'Email', 'Empresa', 'Rol', 'Acción', 'Tabla', 'IP']
  const lines = [
    headers.join(','),
    ...logs.map(l => [
      new Date(l.created_at).toLocaleString('es-AR'),
      l.usuario?.nombre_completo ?? 'Sistema',
      l.usuario?.email ?? '—',
      (l.usuario as any)?.empresa?.nombre ?? '—',
      l.usuario?.rol ?? '—',
      l.accion,
      l.tabla_afectada ?? '—',
      l.ip_origen ?? '—',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function LogsGlobales() {
  const [search, setSearch] = useState('')
  const [filterEmpresa, setFilterEmpresa] = useState('')
  const [filterAccion, setFilterAccion] = useState('')
  const { data: empresas = [] } = useTodasEmpresas()
  const { data: logs = [], isLoading } = useLogsGlobales(filterEmpresa, filterAccion)

  const filtrados = logs.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (l.usuario?.nombre_completo ?? '').toLowerCase().includes(q) ||
      (l.usuario?.email ?? '').toLowerCase().includes(q) ||
      (l.accion ?? '').toLowerCase().includes(q) ||
      ((l.usuario as any)?.empresa?.nombre ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <PageLayout
      title="Logs Globales"
      subtitle="Historial completo de acciones de toda la plataforma"
      actions={
        <button
          onClick={() => exportCSV(filtrados)}
          disabled={filtrados.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[8px] bg-[var(--card-bg)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] disabled:opacity-40 transition-colors"
        >
          <Download size={13} /> Exportar CSV
        </button>
      }
    >
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faded)]" />
          <input
            type="text"
            placeholder="Buscar usuario, email, empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] transition-all"
          />
        </div>
        <select
          value={filterEmpresa}
          onChange={e => setFilterEmpresa(e.target.value)}
          className="py-2.5 px-3 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] text-[var(--text-primary)]"
        >
          <option value="">Todas las empresas</option>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <select
          value={filterAccion}
          onChange={e => setFilterAccion(e.target.value)}
          className="py-2.5 px-3 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] text-[var(--text-primary)]"
        >
          <option value="">Todas las acciones</option>
          {Object.entries(ACCION_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
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
              <div key={i} className="h-10 bg-[var(--skeleton)] rounded-[8px] animate-pulse" />
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
                  {['Fecha', 'Usuario', 'Empresa', 'Acción', 'Tabla', 'IP'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(log => {
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
                      <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">
                        {(log.usuario as any)?.empresa?.nombre ?? '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: `${config?.color ?? '#888780'}18`,
                            color: config?.color ?? '#888780',
                          }}
                        >
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
