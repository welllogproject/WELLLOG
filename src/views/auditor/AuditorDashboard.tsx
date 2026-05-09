import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'
import { Link } from 'react-router-dom'
import { Map, AlertTriangle, Users, Clock } from 'lucide-react'

// Obtiene los equipos autorizados para el auditor via permisos_acceso
function useAuditorStats() {
  const { usuario } = useAuthStore()

  return useQuery({
    queryKey: ['auditor', 'stats', usuario?.empresa_id],
    queryFn: async () => {
      if (!usuario?.empresa_id) return { equipos: [], personasDentro: 0, incidentesPendientes: 0 }

      // 1. Obtener equipos autorizados via permisos_acceso
      const { data: permisos } = await supabase
        .from('permisos_acceso')
        .select('equipo_id, puede_ver_incidentes')
        .eq('empresa_auditora_id', usuario.empresa_id)
        .eq('activo', true)
        .lte('fecha_inicio', new Date().toISOString().split('T')[0])

      const permisosActivos = permisos ?? []

      // equipo_id null = acceso a todos los equipos de esa empresa propietaria
      // Por ahora filtramos solo los que tienen equipo_id explícito
      const equipoIds = permisosActivos
        .filter((p) => p.equipo_id)
        .map((p) => p.equipo_id as string)

      const puedeVerIncidentes = permisosActivos.some((p) => p.puede_ver_incidentes)

      if (equipoIds.length === 0) {
        return { equipos: [], personasDentro: 0, incidentesPendientes: 0 }
      }

      // 2. Cargar equipos autorizados
      const { data: equiposData } = await supabase
        .from('equipos')
        .select('id, nombre_equipo, estado, locacion:locaciones(codigo)')
        .in('id', equipoIds)
        .is('deleted_at', null)

      // 3. Personas dentro en esos equipos
      const { count: personasDentro } = await supabase
        .from('registros_acceso')
        .select('*', { count: 'exact', head: true })
        .in('equipo_id', equipoIds)
        .eq('estado', 'dentro')

      // 4. Incidentes pendientes (solo si tiene permiso)
      let incidentesPendientes = 0
      if (puedeVerIncidentes) {
        const { count } = await supabase
          .from('incidentes')
          .select('*', { count: 'exact', head: true })
          .in('equipo_id', equipoIds)
          .eq('estado', 'pendiente')
        incidentesPendientes = count ?? 0
      }

      return {
        equipos: (equiposData ?? []) as any[],
        personasDentro: personasDentro ?? 0,
        incidentesPendientes,
      }
    },
    enabled: !!usuario?.empresa_id,
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
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-[var(--skeleton)] rounded-[10px] animate-pulse" />
              ))}
            </div>
          ) : (data?.equipos ?? []).length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              Sin equipos autorizados. Contactá al administrador.
            </p>
          ) : (
            <div className="space-y-1">
              {(data?.equipos ?? []).map((eq: any) => (
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
          )}
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
                className="p-4 rounded-[12px] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)] transition-all">
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
