import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageLayout } from '@/components/layout/PageLayout'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { AlertTriangle, Search } from 'lucide-react'
import type { Incidente } from '@/types/models'

const TIPO_LABELS: Record<string, string> = {
  lesion: 'Lesión', accidente: 'Accidente', casi_accidente: 'Casi accidente',
  dano_material: 'Daño material', enfermedad: 'Enfermedad', otro: 'Otro',
}
const GRAVEDAD_VARIANT: Record<string, 'activo' | 'warning' | 'danger' | 'inactivo'> = {
  leve: 'activo', moderado: 'warning', grave: 'danger', critico: 'danger',
}
const GRAVEDAD_LABELS: Record<string, string> = {
  leve: 'Leve', moderado: 'Moderado', grave: 'Grave', critico: 'Crítico',
}
const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente', investigando: 'En investigación', cerrado: 'Cerrado',
}

function useIncidentesAuditor() {
  return useQuery({
    queryKey: ['auditor', 'incidentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidentes')
        .select(`
          id, dni_afectado, nombre_afectado, empresa_afectado, funcion_afectado,
          descripcion, tipo, gravedad, dias_perdidos, estado, fecha_incidente,
          equipo:equipos(id, nombre_equipo),
          locacion:locaciones(id, codigo, nombre)
        `)
        .order('fecha_incidente', { ascending: false })
      if (error) throw error
      return (data ?? []) as any[]
    },
    refetchInterval: 60_000,
  })
}

export function IncidentesAuditor() {
  const { data: incidentes = [], isLoading } = useIncidentesAuditor()
  const [search, setSearch] = useState('')
  const [detalle, setDetalle] = useState<any | null>(null)

  const filtrados = incidentes.filter((i) => {
    const q = search.toLowerCase()
    return (
      i.nombre_afectado?.toLowerCase().includes(q) ||
      i.dni_afectado?.includes(q) ||
      (i.equipo?.nombre_equipo ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <PageLayout
      title="Incidentes"
      subtitle="Declaraciones HSE de equipos autorizados — solo lectura"
    >
      <div className="relative max-w-xs mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faded)]" />
        <input
          type="text"
          placeholder="Buscar por nombre, DNI o equipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15 transition-all"
        />
      </div>

      <Table
        columns={[
          {
            key: 'fecha', header: 'Fecha',
            render: (i) => (
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {new Date(i.fecha_incidente).toLocaleDateString('es-AR')}
              </span>
            ),
          },
          {
            key: 'equipo', header: 'Equipo',
            render: (i) => (
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{i.equipo?.nombre_equipo ?? '—'}</p>
                {i.locacion && <p className="text-xs text-[var(--text-muted)]">{i.locacion.codigo}</p>}
              </div>
            ),
          },
          {
            key: 'afectado', header: 'Afectado',
            render: (i) => (
              <div>
                <p className="text-sm text-[var(--text-primary)]">{i.nombre_afectado}</p>
                <p className="text-xs text-[var(--text-muted)]">{i.dni_afectado}{i.empresa_afectado ? ` — ${i.empresa_afectado}` : ''}</p>
              </div>
            ),
          },
          {
            key: 'tipo', header: 'Tipo',
            render: (i) => <span className="text-xs text-[var(--text-secondary)]">{TIPO_LABELS[i.tipo] ?? i.tipo ?? '—'}</span>,
          },
          {
            key: 'gravedad', header: 'Gravedad',
            render: (i) => i.gravedad
              ? <Badge variant={GRAVEDAD_VARIANT[i.gravedad] ?? 'neutral'} size="sm">{GRAVEDAD_LABELS[i.gravedad]}</Badge>
              : <span className="text-xs text-[var(--text-muted)]">—</span>,
          },
          {
            key: 'estado', header: 'Estado',
            render: (i) => (
              <Badge
                variant={i.estado === 'cerrado' ? 'inactivo' : i.estado === 'investigando' ? 'warning' : 'danger'}
                showDot size="sm"
              >
                {ESTADO_LABELS[i.estado] ?? i.estado}
              </Badge>
            ),
          },
          {
            key: 'acciones', header: '', cellClass: 'text-right',
            render: (i) => (
              <button
                onClick={() => setDetalle(i)}
                className="px-2.5 py-1 text-xs rounded-lg hover:bg-[#7F77DD]/10 text-[var(--text-secondary)] hover:text-[#534AB7] transition-colors"
              >
                Ver
              </button>
            ),
          },
        ]}
        data={filtrados}
        rowKey={(i) => i.id}
        isLoading={isLoading}
        emptyMessage="No hay incidentes para los equipos autorizados"
      />

      <Modal isOpen={!!detalle} onClose={() => setDetalle(null)} title="Detalle del incidente" size="md">
        {detalle && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Equipo</p>
                <p className="font-medium text-[var(--text-primary)]">{detalle.equipo?.nombre_equipo ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Locación</p>
                <p className="text-[var(--text-primary)]">{detalle.locacion?.codigo ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Afectado</p>
                <p className="font-medium text-[var(--text-primary)]">{detalle.nombre_afectado}</p>
                <p className="text-xs text-[var(--text-muted)]">{detalle.dni_afectado}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Empresa</p>
                <p className="text-[var(--text-primary)]">{detalle.empresa_afectado ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Tipo</p>
                <p className="text-[var(--text-primary)]">{TIPO_LABELS[detalle.tipo] ?? detalle.tipo ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Gravedad</p>
                {detalle.gravedad
                  ? <Badge variant={GRAVEDAD_VARIANT[detalle.gravedad] ?? 'neutral'} size="sm">{GRAVEDAD_LABELS[detalle.gravedad]}</Badge>
                  : <span className="text-[var(--text-muted)]">—</span>}
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Días perdidos</p>
                <p className="text-[var(--text-primary)]">{detalle.dias_perdidos ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Fecha</p>
                <p className="text-[var(--text-primary)]">{new Date(detalle.fecha_incidente).toLocaleString('es-AR')}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Descripción</p>
              <p className="text-sm text-[var(--text-primary)] bg-[var(--input-bg)] rounded-[10px] p-3">{detalle.descripcion}</p>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className={detalle.estado === 'cerrado' ? 'text-[var(--text-muted)]' : 'text-[#E24B4A]'} />
              <Badge
                variant={detalle.estado === 'cerrado' ? 'inactivo' : detalle.estado === 'investigando' ? 'warning' : 'danger'}
                showDot size="sm"
              >
                {ESTADO_LABELS[detalle.estado] ?? detalle.estado}
              </Badge>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  )
}
