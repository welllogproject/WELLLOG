import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Download, FileSpreadsheet } from 'lucide-react'

function useRegistrosExport(equipo_id: string, fecha_desde: string, fecha_hasta: string) {
  const { usuario } = useAuthStore()
  return useQuery({
    queryKey: ['auditor', 'registros-export', usuario?.empresa_id, equipo_id, fecha_desde, fecha_hasta],
    queryFn: async () => {
      if (!fecha_desde || !fecha_hasta || !usuario?.empresa_id) return []

      // Obtener equipos autorizados
      const { data: permisos } = await supabase
        .from('permisos_acceso')
        .select('equipo_id')
        .eq('empresa_auditora_id', usuario.empresa_id)
        .eq('activo', true)
        .lte('fecha_inicio', new Date().toISOString().split('T')[0])

      const autorizados = (permisos ?? [])
        .filter((p) => p.equipo_id)
        .map((p) => p.equipo_id as string)

      if (autorizados.length === 0) return []

      // Si se especificó un equipo, verificar que está autorizado
      const filtroEquipos = equipo_id
        ? (autorizados.includes(equipo_id) ? [equipo_id] : [])
        : autorizados

      if (filtroEquipos.length === 0) return []

      let q = supabase
        .from('registros_acceso')
        .select(`
          id, dni, nombre_completo, funcion_visitante, motivo_visita,
          empresa_visitante_nombre, vehiculo_patente,
          fecha_ingreso, fecha_egreso, estado, declara_incidente,
          equipo:equipos(nombre_equipo),
          locacion:locaciones(codigo)
        `)
        .in('equipo_id', filtroEquipos)
        .gte('fecha_ingreso', `${fecha_desde}T00:00:00`)
        .lte('fecha_ingreso', `${fecha_hasta}T23:59:59`)
        .is('deleted_at', null)
        .order('fecha_ingreso', { ascending: false })

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    enabled: !!fecha_desde && !!fecha_hasta && !!usuario?.empresa_id,
  })
}

function useEquiposAuditor() {
  const { usuario } = useAuthStore()
  return useQuery({
    queryKey: ['auditor', 'equipos-lista', usuario?.empresa_id],
    queryFn: async () => {
      if (!usuario?.empresa_id) return []

      const { data: permisos } = await supabase
        .from('permisos_acceso')
        .select('equipo_id')
        .eq('empresa_auditora_id', usuario.empresa_id)
        .eq('activo', true)
        .lte('fecha_inicio', new Date().toISOString().split('T')[0])

      const ids = (permisos ?? [])
        .filter((p) => p.equipo_id)
        .map((p) => p.equipo_id as string)

      if (ids.length === 0) return []

      const { data } = await supabase
        .from('equipos')
        .select('id, nombre_equipo')
        .in('id', ids)
        .is('deleted_at', null)
        .order('nombre_equipo')
      return data ?? []
    },
    enabled: !!usuario?.empresa_id,
  })
}

function duracion(ingreso: string, egreso: string | null): string {
  if (!egreso) return 'Activo'
  const diff = (new Date(egreso).getTime() - new Date(ingreso).getTime()) / 60000
  if (diff < 60) return `${Math.round(diff)} min`
  return `${(diff / 60).toFixed(1)} h`
}

function exportCSV(rows: any[], filename: string) {
  const headers = ['Fecha ingreso', 'Equipo', 'Locación', 'DNI', 'Nombre', 'Empresa', 'Función', 'Motivo', 'Patente', 'Estado', 'Duración', 'Incidente']
  const lines = [
    headers.join(','),
    ...rows.map((r) => [
      new Date(r.fecha_ingreso).toLocaleString('es-AR'),
      r.equipo?.nombre_equipo ?? '',
      r.locacion?.codigo ?? '',
      r.dni,
      r.nombre_completo,
      r.empresa_visitante_nombre ?? '',
      r.funcion_visitante ?? '',
      r.motivo_visita,
      r.vehiculo_patente ?? '',
      r.estado,
      duracion(r.fecha_ingreso, r.fecha_egreso),
      r.declara_incidente === true ? 'SÍ' : r.declara_incidente === false ? 'NO' : '—',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // Revocar después de un tick para que el browser complete la descarga
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const HOY = new Date().toISOString().split('T')[0]
const HACE30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

export function ReportesAuditor() {
  const [equipo, setEquipo] = useState('')
  const [desde, setDesde] = useState(HACE30)
  const [hasta, setHasta] = useState(HOY)

  const { data: equipos = [] } = useEquiposAuditor()
  const { data: registros = [], isLoading, isFetching } = useRegistrosExport(equipo, desde, hasta)

  const totalHoras = registros.reduce((acc, r: any) => {
    if (!r.fecha_egreso) return acc
    return acc + (new Date(r.fecha_egreso).getTime() - new Date(r.fecha_ingreso).getTime()) / 3600000
  }, 0)

  const filename = `WELLLOG_registros_${desde}_${hasta}${equipo ? `_${equipos.find((e: any) => e.id === equipo)?.nombre_equipo ?? ''}` : ''}.csv`

  return (
    <PageLayout title="Reportes" subtitle="Exportar registros de acceso de equipos autorizados">
      {/* Filtros */}
      <div className="card-clay p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Select
            label="Equipo"
            value={equipo}
            onChange={(e) => setEquipo(e.target.value)}
            options={equipos.map((e: any) => ({ value: e.id, label: e.nombre_equipo }))}
            placeholder="Todos los equipos"
          />
          <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <div className="flex items-end">
            <Button
              variant="ingreso"
              size="sm"
              className="w-full"
              onClick={() => exportCSV(registros, filename)}
              loading={isFetching}
              disabled={registros.length === 0}
            >
              <Download size={14} className="mr-1.5" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {registros.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Registros', value: registros.length },
            { label: 'Personas únicas', value: new Set((registros as any[]).map((r) => r.dni)).size },
            { label: 'Horas hombre', value: totalHoras.toFixed(1) },
            { label: 'Incidentes', value: (registros as any[]).filter((r) => r.declara_incidente === true).length },
          ].map(({ label, value }) => (
            <div key={label} className="card-clay p-4">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-medium text-[var(--text-primary)] tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla preview */}
      <div className="card-clay overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--divider)]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-[#1D9E75]" />
            <h2 className="text-sm font-medium text-[var(--text-primary)]">
              Vista previa{registros.length > 0 ? ` — ${registros.length} registros` : ''}
            </h2>
          </div>
          {registros.length > 0 && (
            <Badge variant="activo" size="sm">{registros.length} filas</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-[#F0F0EE] rounded-[8px] animate-pulse" />
            ))}
          </div>
        ) : registros.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              {!desde || !hasta ? 'Seleccioná un rango de fechas' : 'No hay registros para el período seleccionado'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--divider)]">
                  {['Fecha', 'Equipo', 'DNI', 'Nombre', 'Empresa', 'Estado', 'Duración', 'Incidente'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(registros as any[]).slice(0, 50).map((r) => (
                  <tr key={r.id} className="border-b border-[var(--divider)] hover:bg-[var(--hover-bg)] transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(r.fecha_ingreso).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]">{r.equipo?.nombre_equipo ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-[var(--text-secondary)]">{r.dni}</td>
                    <td className="px-4 py-2.5 text-sm text-[var(--text-primary)]">{r.nombre_completo}</td>
                    <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{r.empresa_visitante_nombre ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={r.estado === 'dentro' ? 'activo' : r.estado === 'afuera' ? 'inactivo' : 'neutral'} size="sm">
                        {r.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {duracion(r.fecha_ingreso, r.fecha_egreso)}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.declara_incidente === true
                        ? <span className="text-xs font-medium text-[#E24B4A]">SÍ</span>
                        : r.declara_incidente === false
                        ? <span className="text-xs text-[#1D9E75]">NO</span>
                        : <span className="text-xs text-[var(--text-muted)]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registros.length > 50 && (
              <p className="text-xs text-[var(--text-muted)] text-center py-3">
                Mostrando 50 de {registros.length} — exportá el CSV para verlos todos
              </p>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
