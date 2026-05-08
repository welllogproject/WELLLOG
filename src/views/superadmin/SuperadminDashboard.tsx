import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageLayout } from '@/components/layout/PageLayout'
import { Badge } from '@/components/ui/Badge'
import { Building2, Users, Layers, ClipboardList, AlertTriangle, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color?: string
}

function KpiCard({ icon, label, value, sub, color = '#7F77DD' }: KpiCardProps) {
  return (
    <div className="card-clay p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#5F5E5A] uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-medium text-[#2C2C2A] mt-1.5 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-[#888780] mt-1">{sub}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${color}18` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

function usePlatformStats() {
  return useQuery({
    queryKey: ['superadmin', 'stats'],
    queryFn: async () => {
      const [empresasRes, usuariosRes, equiposRes, registrosHoyRes, incidentesRes] = await Promise.all([
        supabase.from('empresas').select('tipo, activa'),
        supabase.from('usuarios').select('estado'),
        supabase.from('equipos').select('estado').is('deleted_at', null),
        supabase.from('registros_acceso').select('id', { count: 'exact', head: true })
          .gte('fecha_ingreso', new Date().toISOString().split('T')[0]),
        supabase.from('incidentes').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      ])

      const empresas = empresasRes.data ?? []
      const usuarios = usuariosRes.data ?? []
      const equipos = equiposRes.data ?? []

      return {
        contratistasActivas: empresas.filter((e) => e.tipo === 'contratista' && e.activa).length,
        operadorasActivas: empresas.filter((e) => e.tipo === 'operadora' && e.activa).length,
        totalEmpresas: empresas.length,
        usuariosActivos: usuarios.filter((u) => u.estado === 'activo').length,
        equiposActivos: equipos.filter((e) => e.estado === 'activo').length,
        registrosHoy: registrosHoyRes.count ?? 0,
        incidentesPendientes: incidentesRes.count ?? 0,
      }
    },
    refetchInterval: 60_000,
  })
}

function useUltimasEmpresas() {
  return useQuery({
    queryKey: ['superadmin', 'ultimas-empresas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nombre, tipo, plan, activa, created_at')
        .order('created_at', { ascending: false })
        .limit(8)
      if (error) throw error
      return data ?? []
    },
  })
}

const PLAN_LABELS = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' }
const PLAN_VARIANT: Record<string, 'neutral' | 'info' | 'dentro'> = {
  free: 'neutral',
  pro: 'info',
  enterprise: 'dentro',
}

export function SuperadminDashboard() {
  const { data: stats, isLoading } = usePlatformStats()
  const { data: empresas, isLoading: loadingEmpresas } = useUltimasEmpresas()

  return (
    <PageLayout
      title="Plataforma"
      subtitle="Vista global del sistema WELL LOG"
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <KpiCard
          icon={<Building2 size={18} />}
          label="Contratistas"
          value={isLoading ? '—' : stats!.contratistasActivas}
          sub="activas"
          color="#7F77DD"
        />
        <KpiCard
          icon={<Building2 size={18} />}
          label="Operadoras"
          value={isLoading ? '—' : stats!.operadorasActivas}
          sub="activas"
          color="#1D9E75"
        />
        <KpiCard
          icon={<Users size={18} />}
          label="Usuarios"
          value={isLoading ? '—' : stats!.usuariosActivos}
          sub="activos"
          color="#534AB7"
        />
        <KpiCard
          icon={<Layers size={18} />}
          label="Equipos"
          value={isLoading ? '—' : stats!.equiposActivos}
          sub="operativos"
          color="#BA7517"
        />
        <KpiCard
          icon={<ClipboardList size={18} />}
          label="Registros hoy"
          value={isLoading ? '—' : stats!.registrosHoy}
          sub="en toda la plataforma"
          color="#1D9E75"
        />
        <KpiCard
          icon={<AlertTriangle size={18} />}
          label="Incidentes"
          value={isLoading ? '—' : stats!.incidentesPendientes}
          sub="pendientes"
          color="#E24B4A"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas empresas */}
        <div className="card-clay p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#2C2C2A]">Empresas recientes</h2>
            <Link
              to="/superadmin/empresas"
              className="text-xs text-[#7F77DD] hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {loadingEmpresas
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 bg-[#F0F0EE] rounded-[10px] animate-pulse" />
                ))
              : (empresas ?? []).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-[10px] hover:bg-[#F8F8F6] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                        style={{
                          background: e.tipo === 'contratista' ? '#7F77DD' : '#1D9E75',
                        }}
                      >
                        {e.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#2C2C2A]">{e.nombre}</p>
                        <p className="text-xs text-[#888780] capitalize">{e.tipo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={PLAN_VARIANT[e.plan]} size="sm">
                        {PLAN_LABELS[e.plan as keyof typeof PLAN_LABELS]}
                      </Badge>
                      {!e.activa && (
                        <Badge variant="danger" size="sm">Suspendida</Badge>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="card-clay p-5">
          <h2 className="text-sm font-medium text-[#2C2C2A] mb-4">Gestión de la plataforma</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/superadmin/empresas', icon: <Building2 size={20} />, label: 'Empresas', desc: 'Contratistas y operadoras', color: '#7F77DD' },
              { to: '/superadmin/usuarios', icon: <Users size={20} />, label: 'Usuarios', desc: 'Todos los usuarios', color: '#1D9E75' },
              { to: '/superadmin/permisos', icon: <TrendingUp size={20} />, label: 'Permisos', desc: 'Acceso multi-tenant', color: '#BA7517' },
              { to: '/superadmin/logs', icon: <ClipboardList size={20} />, label: 'Logs', desc: 'Auditoría global', color: '#534AB7' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="p-4 rounded-[12px] border border-[rgba(0,0,0,0.08)] hover:border-[rgba(0,0,0,0.14)] hover:bg-[#F8F8F6] transition-all"
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-3"
                  style={{ background: `${item.color}18`, color: item.color }}
                >
                  {item.icon}
                </div>
                <p className="text-sm font-medium text-[#2C2C2A]">{item.label}</p>
                <p className="text-xs text-[#888780] mt-0.5">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
