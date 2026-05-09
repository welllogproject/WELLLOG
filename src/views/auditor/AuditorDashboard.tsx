import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageLayout } from '@/components/layout/PageLayout'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'
import { Link } from 'react-router-dom'
import { Map, AlertTriangle, Users, Clock } from 'lucide-react'

function useAuditorStats() {
  return useQuery({
    queryKey: ['auditor', 'stats'],
    queryFn: async () => {
      const [equiposRes, registrosRes, incidentesRes] = await Promise.all([
        supabase.from('equipos').select('id, nombre_equipo, estado, locacion:locaciones(codigo), personas_dentro:registros_acceso(count)').is('deleted_at', null),
        supabase.from('registros_acceso').select('id', { count: 'exact', head: true }).eq('estado', 'dentro'),
        supabase.from('incidentes').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      ])
      return {
        equipos: (equiposRes.data ?? []) as any[],
        personasDentro: registrosRes.count ?? 0,
        incidentesPendientes: incidentesRes.count ?? 0,
      }
    },
    refetchInterval: 30_000,
  })
}

const ESTADO_COLOR: Record<string, 'green' | 'amber' | 'gray' | 'red'> = {
  activo: 'green', mantenimiento: 'amber', inactivo: 'gray',
}
const ESTADO_LABELS: Record<string, string> = {
  activo: 'Operativo', mantenimiento: 'Mantenimiento', inactivo: 'Inactivo',
}

export function AuditorDashboard() {
  const { data, isLoading } = useAuditorStats()

  return (
    <PageLayout title="Dashboard Auditor" subtitle="Resumen en tiempo real de los equipos autorizados">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Users size={18} />, label: 'Equipos autorizados', value: data?.equipos.length ?? '—', color: '#7F77DD' },
          { icon: <Users size={18} />, label: 'Personas dentro ahora', value: data?.personasDentro ?? '—', color: '#1D9E75' },
          { icon: <AlertTriangle size={18} />, label: 'Incidentes pendientes', value: data?.incidentesPendientes ?? '—', color: '#E24B4A' },
          { icon: <Clock size={18} />, label: 'Actualización', value: 'Tiempo real', color: '#BA7517' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="card-clay p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-medium text-[var(--text-primary)] mt-1 tabular-nums">{isLoading ? '—' : value}</p>
              </div>
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, color }}>
                {icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Lista de equipos autorizados */}
        <div className="card-clay p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Equipos autorizados</h2>
            <Link to="/auditor/mapa" className="text-xs text-[#7F77DD] hover:underline flex items-center gap-1">
              <Map size={12} /> Ver mapa
            </Link>
          </div>
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-[#F0F0EE] rounded-[10px] animate-pulse" />)
              : (data?.equipos ?? []).map((eq: any) => (
                  <div key={eq.id} className="flex items-center justify-between px-3 py-2.5 rounded-[10px] hover:bg-[var(--hover-bg)] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <StatusDot color={ESTADO_COLOR[eq.estado] ?? 'gray'} pulse={eq.estado === 'activo'} />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{eq.nombre_equipo}</p>
                        <p className="text-xs text-[var(--text-muted)]">{eq.locacion?.codigo ?? 'Sin locación'}</p>
                      </div>
                    </div>
                    <Badge variant={eq.estado === 'activo' ? 'activo' : eq.estado === 'mantenimiento' ? 'mantenimiento' : 'inactivo'} size="sm">
                      {ESTADO_LABELS[eq.estado] ?? eq.estado}
                    </Badge>
                  </div>
                ))}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="card-clay p-5">
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/auditor/mapa', icon: <Map size={20} />, label: 'Mapa', desc: 'Equipos en tiempo real', color: '#7F77DD' },
              { to: '/auditor/incidentes', icon: <AlertTriangle size={20} />, label: 'Incidentes', desc: 'Declaraciones HSE', color: '#E24B4A' },
              { to: '/auditor/reportes', icon: <Users size={20} />, label: 'Reportes', desc: 'Exportar registros', color: '#1D9E75' },
            ].map((item) => (
              <Link key={item.to} to={item.to}
                className="p-4 rounded-[12px] border border-[var(--border)] hover:border-[rgba(0,0,0,0.14)] hover:bg-[var(--hover-bg)] transition-all">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-3" style={{ background: `${item.color}18`, color: item.color }}>
                  {item.icon}
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
