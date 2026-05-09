// src/views/admin/AdminDashboard.tsx
// Dashboard principal admin — KPIs + actividad reciente

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { StatusDot } from '@/components/ui/StatusDot'
import { Users, AlertTriangle, Activity, Building2, TrendingUp, Clock } from 'lucide-react'
import { useIncidentes } from '@/hooks/useIncidentes'
import { useEquipos } from '@/hooks/useEquipos'
import { useRealtimeDashboard } from '@/hooks/useRealtime'
import { useAuthStore } from '@/stores/authStore'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

function KPICard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-medium text-[var(--text-primary)]">{value}</p>
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        {sub && <p className="text-xs text-[var(--text-faded)] mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}

export function AdminDashboard() {
  useRealtimeDashboard()
  const { usuario } = useAuthStore()
  const empresaId = usuario?.empresa_id

  const { data: equipos, isLoading: loadingEquipos } = useEquipos()
  const { data: incidentes, isLoading: loadingIncidentes } = useIncidentes(undefined, 'pendiente')

  // IDs de equipos de esta empresa — para filtrar KPIs correctamente
  const equipoIds = (equipos ?? []).map((e) => e.id)
  const tieneEquipos = equipoIds.length > 0

  // KPI: personas actualmente dentro (solo equipos de esta empresa)
  const { data: personasDentro } = useQuery({
    queryKey: ['kpi', 'personas-dentro', empresaId],
    queryFn: async () => {
      if (!tieneEquipos) return 0
      const { count } = await supabase
        .from('registros_acceso')
        .select('*', { count: 'exact', head: true })
        .in('equipo_id', equipoIds)
        .eq('estado', 'dentro')
        .is('deleted_at', null)
      return count ?? 0
    },
    enabled: !!empresaId && !loadingEquipos,
    refetchInterval: 30000,
  })

  // KPI: ingresos de hoy (solo equipos de esta empresa)
  const { data: ingresosHoy } = useQuery({
    queryKey: ['kpi', 'ingresos-hoy', empresaId],
    queryFn: async () => {
      if (!tieneEquipos) return 0
      const hoy = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('registros_acceso')
        .select('*', { count: 'exact', head: true })
        .in('equipo_id', equipoIds)
        .gte('fecha_ingreso', `${hoy}T00:00:00`)
        .is('deleted_at', null)
      return count ?? 0
    },
    enabled: !!empresaId && !loadingEquipos,
    refetchInterval: 60000,
  })

  // Registros recientes (solo equipos de esta empresa)
  const { data: registrosRecientes } = useQuery({
    queryKey: ['kpi', 'recientes', empresaId],
    queryFn: async () => {
      if (!tieneEquipos) return []
      const { data } = await supabase
        .from('registros_acceso')
        .select('*')
        .in('equipo_id', equipoIds)
        .is('deleted_at', null)
        .order('fecha_ingreso', { ascending: false })
        .limit(8)
      return data ?? []
    },
    enabled: !!empresaId && !loadingEquipos,
    refetchInterval: 30000,
  })

  const equiposActivos = equipos?.filter((e) => e.estado === 'activo').length ?? 0
  const incidentesPendientes = incidentes?.length ?? 0

  return (
    <PageLayout
      title="Dashboard"
      subtitle={`${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          icon={<Users size={20} className="text-white" />}
          label="Personas dentro"
          value={personasDentro ?? '—'}
          sub="En todos los equipos ahora"
          color="bg-[#7F77DD]"
        />
        <KPICard
          icon={<Activity size={20} className="text-white" />}
          label="Ingresos hoy"
          value={ingresosHoy ?? '—'}
          sub="Desde las 00:00 hs"
          color="bg-[#1D9E75]"
        />
        <KPICard
          icon={<Building2 size={20} className="text-white" />}
          label="Equipos activos"
          value={loadingEquipos ? '—' : equiposActivos}
          sub={`de ${equipos?.length ?? 0} en total`}
          color="bg-[#534AB7]"
        />
        <KPICard
          icon={<AlertTriangle size={20} className="text-white" />}
          label="Incidentes pendientes"
          value={loadingIncidentes ? '—' : incidentesPendientes}
          sub="Requieren atención"
          color={incidentesPendientes > 0 ? 'bg-[#E24B4A]' : 'bg-[#888780]'}
        />
      </div>

      {/* Fila inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Actividad reciente */}
        <Card className="lg:col-span-2" padding="none">
          <div className="p-5 border-b border-[var(--divider)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
              <Clock size={15} className="text-[var(--text-muted)]" />
              Actividad reciente
            </h3>
          </div>
          <div className="divide-y divide-[var(--divider)]">
            {!registrosRecientes ? (
              <div className="p-4"><SkeletonCard /></div>
            ) : registrosRecientes.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">Sin actividad hoy</p>
            ) : (
              registrosRecientes.map((r: {
                id: string
                nombre_completo: string
                dni: string
                empresa_visitante_nombre?: string
                estado: 'dentro' | 'afuera' | 'anulado'
                fecha_ingreso: string
                motivo_visita: string
              }) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#7F77DD]/10 flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-[#534AB7]">
                      {r.nombre_completo?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{r.nombre_completo}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {r.empresa_visitante_nombre || 'Sin empresa'} · {r.motivo_visita}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge variant={r.estado === 'dentro' ? 'dentro' : 'afuera'} showDot>
                      {r.estado === 'dentro' ? 'Dentro' : 'Salió'}
                    </Badge>
                    <span className="text-[10px] text-[var(--text-faded)]">
                      {formatDistanceToNow(new Date(r.fecha_ingreso), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Estado de equipos */}
        <Card padding="none">
          <div className="p-5 border-b border-[var(--divider)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp size={15} className="text-[var(--text-muted)]" />
              Estado de equipos
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {loadingEquipos ? (
              <SkeletonCard />
            ) : (equipos ?? []).length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">Sin equipos</p>
            ) : (
              (equipos ?? []).map((equipo) => (
                <div key={equipo.id} className="flex items-center gap-3 py-2">
                  <StatusDot
                    color={
                      equipo.estado === 'activo' ? 'green' :
                      equipo.estado === 'mantenimiento' ? 'amber' : 'gray'
                    }
                    pulse={equipo.estado === 'activo'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{equipo.nombre_equipo}</p>
                    <p className="text-xs text-[var(--text-muted)]">{equipo.locacion?.codigo || 'Sin locación'}</p>
                  </div>
                  <Badge
                    variant={equipo.estado === 'activo' ? 'activo' : equipo.estado === 'mantenimiento' ? 'mantenimiento' : 'inactivo'}
                    size="sm"
                  >
                    {equipo.estado === 'activo' ? 'Operativo' : equipo.estado === 'mantenimiento' ? 'Mant.' : 'Inactivo'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  )
}
