import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

// ── Paleta ClayUI ──────────────────────────────────────────
const C = {
  purple:  '#7F77DD',
  green:   '#1D9E75',
  amber:   '#BA7517',
  red:     '#E24B4A',
  blue:    '#4A90D9',
  gray:    '#888780',
  indigo:  '#534AB7',
  teal:    '#0F6E56',
}

const PIE_COLORS = [C.purple, C.green, C.amber, C.red, C.blue, C.indigo]

// ── Helpers ────────────────────────────────────────────────
function mes(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { month: 'short' })
}
function dia(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium text-[#2C2C2A] mb-4">{children}</h2>
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-clay p-5 ${className}`}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </div>
  )
}

function Skeleton({ h = 200 }: { h?: number }) {
  return <div className="bg-[#F0F0EE] rounded-[10px] animate-pulse" style={{ height: h }} />
}

// ── Queries ────────────────────────────────────────────────

function useRegistrosPorDia() {
  return useQuery({
    queryKey: ['sa-metricas', 'registros-dia'],
    queryFn: async () => {
      const desde = new Date()
      desde.setDate(desde.getDate() - 29)
      const { data, error } = await supabase
        .from('registros_acceso')
        .select('fecha_ingreso')
        .gte('fecha_ingreso', desde.toISOString())
        .is('deleted_at', null)
      if (error) throw error

      const map: Record<string, number> = {}
      for (let i = 0; i < 30; i++) {
        const d = new Date()
        d.setDate(d.getDate() - (29 - i))
        map[d.toISOString().split('T')[0]] = 0
      }
      ;(data ?? []).forEach((r) => {
        const k = r.fecha_ingreso.split('T')[0]
        if (k in map) map[k]++
      })
      return Object.entries(map).map(([fecha, total]) => ({ fecha: dia(fecha), total }))
    },
  })
}

function useRegistrosPorEmpresa() {
  return useQuery({
    queryKey: ['sa-metricas', 'registros-empresa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registros_acceso')
        .select('equipo:equipos!equipo_id(empresa_contratista_id, empresa:empresas!empresa_contratista_id(nombre))')
        .is('deleted_at', null)
      if (error) throw error

      const map: Record<string, number> = {}
      ;(data ?? []).forEach((r: any) => {
        const nombre = r.equipo?.empresa?.nombre ?? 'Desconocida'
        map[nombre] = (map[nombre] ?? 0) + 1
      })
      return Object.entries(map)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
    },
  })
}

function useIncidentesPorMes() {
  return useQuery({
    queryKey: ['sa-metricas', 'incidentes-mes'],
    queryFn: async () => {
      const desde = new Date()
      desde.setMonth(desde.getMonth() - 5)
      desde.setDate(1)
      const { data, error } = await supabase
        .from('incidentes')
        .select('fecha_incidente, tipo, gravedad')
        .gte('fecha_incidente', desde.toISOString())
      if (error) throw error

      const map: Record<string, { mes: string; total: number; leves: number; graves: number }> = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const k = d.toISOString().substring(0, 7)
        map[k] = { mes: mes(d.toISOString()), total: 0, leves: 0, graves: 0 }
      }
      ;(data ?? []).forEach((inc: any) => {
        const k = inc.fecha_incidente.substring(0, 7)
        if (!(k in map)) return
        map[k].total++
        if (inc.gravedad === 'leve' || inc.gravedad === 'moderado') map[k].leves++
        else map[k].graves++
      })
      return Object.values(map)
    },
  })
}

function useDistribucionEmpresas() {
  return useQuery({
    queryKey: ['sa-metricas', 'dist-empresas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('empresas').select('tipo, plan, activa')
      if (error) throw error
      const items = data ?? []

      const porTipo = [
        { name: 'Contratistas', value: items.filter((e) => e.tipo === 'contratista').length },
        { name: 'Operadoras',   value: items.filter((e) => e.tipo === 'operadora').length },
      ]
      const porPlan = [
        { name: 'Free',       value: items.filter((e) => e.plan === 'free').length },
        { name: 'Pro',        value: items.filter((e) => e.plan === 'pro').length },
        { name: 'Enterprise', value: items.filter((e) => e.plan === 'enterprise').length },
      ].filter((p) => p.value > 0)

      return { porTipo, porPlan }
    },
  })
}

function useDistribucionUsuarios() {
  return useQuery({
    queryKey: ['sa-metricas', 'dist-usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase.from('usuarios').select('rol, estado')
      if (error) throw error
      const items = data ?? []

      const roles = ['superadmin', 'admin', 'supervisor', 'operador', 'auditor']
      return roles.map((rol) => ({
        rol: rol.charAt(0).toUpperCase() + rol.slice(1),
        total: items.filter((u) => u.rol === rol).length,
        activos: items.filter((u) => u.rol === rol && u.estado === 'activo').length,
      })).filter((r) => r.total > 0)
    },
  })
}

function useEquiposPorEstado() {
  return useQuery({
    queryKey: ['sa-metricas', 'equipos-estado'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipos')
        .select('estado')
        .is('deleted_at', null)
      if (error) throw error
      const items = data ?? []
      return [
        { name: 'Operativos',     value: items.filter((e) => e.estado === 'activo').length },
        { name: 'Mantenimiento',  value: items.filter((e) => e.estado === 'mantenimiento').length },
        { name: 'Inactivos',      value: items.filter((e) => e.estado === 'inactivo').length },
      ].filter((e) => e.value > 0)
    },
  })
}

// ── Tooltip personalizado ──────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-[10px] shadow-clay-sm px-3 py-2.5 text-xs">
      {label && <p className="font-medium text-[#2C2C2A] mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color ?? p.fill }} />
          {p.name}: <span className="font-medium ml-0.5">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── Vista principal ────────────────────────────────────────
export function MetricasPlataforma() {
  const { data: regDia,    isLoading: l1 } = useRegistrosPorDia()
  const { data: regEmp,    isLoading: l2 } = useRegistrosPorEmpresa()
  const { data: incMes,    isLoading: l3 } = useIncidentesPorMes()
  const { data: distEmp,   isLoading: l4 } = useDistribucionEmpresas()
  const { data: distUsr,   isLoading: l5 } = useDistribucionUsuarios()
  const { data: eqEstado,  isLoading: l6 } = useEquiposPorEstado()

  return (
    <PageLayout title="Métricas" subtitle="Actividad global de la plataforma">

      {/* Fila 1 — Registros en el tiempo */}
      <div className="mb-5">
        <ChartCard title="Registros de acceso — últimos 30 días">
          {l1 ? <Skeleton h={220} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={regDia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.purple} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: C.gray }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: C.gray }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="total" name="Registros"
                  stroke={C.purple} strokeWidth={2}
                  fill="url(#gradReg)" dot={false} activeDot={{ r: 4, fill: C.purple }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Fila 2 — Incidentes por mes + Actividad por empresa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Incidentes — últimos 6 meses">
          {l3 ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={incMes} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: C.gray }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.gray }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="leves"  name="Leves/Moderados" fill={C.amber}  radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="graves" name="Graves/Críticos"  fill={C.red}    radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Registros acumulados por empresa">
          {l2 ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={regEmp} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: C.gray }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: '#2C2C2A' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Registros" fill={C.green} radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Fila 3 — Distribuciones en pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <ChartCard title="Tipo de empresa">
          {l4 ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={distEmp?.porTipo} cx="50%" cy="45%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value"
                >
                  {distEmp?.porTipo.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Plan de facturación">
          {l4 ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={distEmp?.porPlan} cx="50%" cy="45%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value"
                >
                  {distEmp?.porPlan.map((_, i) => (
                    <Cell key={i} fill={[C.gray, C.purple, C.indigo][i % 3]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Estado de equipos">
          {l6 ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={eqEstado} cx="50%" cy="45%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value"
                >
                  {eqEstado?.map((_, i) => (
                    <Cell key={i} fill={[C.green, C.amber, C.gray][i % 3]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Fila 4 — Usuarios por rol */}
      <ChartCard title="Usuarios por rol">
        {l5 ? <Skeleton h={180} /> : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={distUsr} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="rol" tick={{ fontSize: 11, fill: C.gray }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.gray }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total"   name="Total"   fill={C.purple} radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="activos" name="Activos"  fill={C.green}  radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

    </PageLayout>
  )
}
