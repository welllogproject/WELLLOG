import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { useEquipos } from '@/hooks/useEquipos'
import { Users, Clock, Building2, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'

const COLORES = ['#7F77DD', '#1D9E75', '#BA7517', '#E24B4A', '#534AB7', '#0F6E56']

function KPI({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card-clay p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[#5F5E5A] uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-medium text-[#2C2C2A] mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-[#888780] mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, color }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function Estadisticas() {
  const { data: equipos = [] } = useEquipos()
  const [equipoId, setEquipoId] = useState('')

  const { data: metricas = [], isLoading } = useQuery({
    queryKey: ['estadisticas', 'operacional', equipoId],
    queryFn: async () => {
      const hace30 = new Date()
      hace30.setDate(hace30.getDate() - 30)
      let q = supabase
        .from('metricas_diarias')
        .select('*')
        .gte('fecha', hace30.toISOString().split('T')[0])
        .order('fecha')
      if (equipoId) q = q.eq('equipo_id', equipoId)
      const { data } = await q
      return data ?? []
    },
  })

  const { data: topEmpresas = [] } = useQuery({
    queryKey: ['estadisticas', 'top-empresas', equipoId],
    queryFn: async () => {
      const hace30 = new Date()
      hace30.setDate(hace30.getDate() - 30)
      let q = supabase
        .from('registros_acceso')
        .select('empresa_visitante_nombre')
        .gte('fecha_ingreso', hace30.toISOString())
        .not('empresa_visitante_nombre', 'is', null)
        .is('deleted_at', null)
      if (equipoId) q = q.eq('equipo_id', equipoId)
      const { data } = await q
      const counts: Record<string, number> = {}
      ;(data ?? []).forEach((r: any) => {
        const k = r.empresa_visitante_nombre ?? 'Sin empresa'
        counts[k] = (counts[k] ?? 0) + 1
      })
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    },
  })

  const totales = metricas.reduce((acc, m: any) => ({
    ingresos: acc.ingresos + (m.total_ingresos ?? 0),
    egresos: acc.egresos + (m.total_egresos ?? 0),
    horasHombre: acc.horasHombre + (m.horas_hombre_total ?? 0),
    promPermanencia: acc.promPermanencia + (m.promedio_permanencia_minutos ?? 0),
  }), { ingresos: 0, egresos: 0, horasHombre: 0, promPermanencia: 0 })

  const promPermanencia = metricas.length > 0
    ? Math.round(totales.promPermanencia / metricas.length)
    : 0

  const chartData = metricas.slice(-14).map((m: any) => ({
    fecha: new Date(m.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    Ingresos: m.total_ingresos ?? 0,
    HH: Number((m.horas_hombre_total ?? 0).toFixed(1)),
    Empresas: m.empresas_distintas ?? 0,
  }))

  return (
    <PageLayout title="Estadísticas Operacionales" subtitle="Movimiento y actividad de los últimos 30 días">
      <div className="flex items-center gap-2 mb-5">
        <select value={equipoId} onChange={(e) => setEquipoId(e.target.value)}
          className="text-sm bg-white border border-[rgba(0,0,0,0.1)] rounded-clay-sm py-2 px-3 outline-none focus:border-[#7F77DD]">
          <option value="">Todos los equipos</option>
          {equipos.map((eq) => <option key={eq.id} value={eq.id}>{eq.nombre_equipo}</option>)}
        </select>
        <span className="text-xs text-[#888780]">Últimos 30 días</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPI label="Total ingresos" value={totales.ingresos} icon={<Users size={18} />} color="#7F77DD" />
        <KPI label="Horas hombre" value={totales.horasHombre.toFixed(0)} sub="acumuladas" icon={<TrendingUp size={18} />} color="#1D9E75" />
        <KPI label="Prom. permanencia" value={`${promPermanencia} min`} sub="por visita" icon={<Clock size={18} />} color="#BA7517" />
        <KPI label="Empresas distintas" value={topEmpresas.length} sub="en el período" icon={<Building2 size={18} />} color="#534AB7" />
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => <div key={i} className="h-52 bg-[#F0F0EE] rounded-[16px] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-4">
          <Card>
            <h3 className="text-sm font-medium text-[#2C2C2A] mb-4">Ingresos diarios — últimos 14 días</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#888780' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888780' }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
                <Bar dataKey="Ingresos" fill="#7F77DD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-medium text-[#2C2C2A] mb-4">Horas Hombre diarias</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#888780' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#888780' }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
                  <Line type="monotone" dataKey="HH" stroke="#1D9E75" strokeWidth={2} dot={false} name="HH" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="text-sm font-medium text-[#2C2C2A] mb-4">Top empresas visitantes</h3>
              {topEmpresas.length === 0 ? (
                <p className="text-sm text-[#888780] py-8 text-center">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topEmpresas} layout="vertical" margin={{ left: 8 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#888780' }} />
                    <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: '#5F5E5A' }} width={110} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
                    <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                      {topEmpresas.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
