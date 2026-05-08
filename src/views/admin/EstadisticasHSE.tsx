// src/views/admin/EstadisticasHSE.tsx
// Dashboard HSE: IF, IG, tendencias, días sin incidentes

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ShieldCheck, TrendingDown, Calendar, Activity } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useEquipos } from '@/hooks/useEquipos'
import { useState } from 'react'

function HSEIndexCard({
  label, value, desc, icon, color
}: { label: string; value: string; desc: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-medium text-[#2C2C2A]">{value}</p>
        <p className="text-sm font-medium text-[#2C2C2A] mt-0.5">{label}</p>
        <p className="text-xs text-[#888780] mt-1 leading-snug">{desc}</p>
      </div>
    </Card>
  )
}

export function EstadisticasHSE() {
  const { data: equipos } = useEquipos()
  const [equipoId, setEquipoId] = useState('')

  const { data: metricas, isLoading } = useQuery({
    queryKey: ['metricas', equipoId, 'hse'],
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

  // Calcular totales acumulados
  const totales = (metricas ?? []).reduce((acc, m) => ({
    horasHombre: acc.horasHombre + (m.horas_hombre_total || 0),
    incidentesLesion: acc.incidentesLesion + (m.incidentes_lesion || 0),
    diasPerdidos: acc.diasPerdidos + 0, // disponible en tabla incidentes
    totalIncidentes: acc.totalIncidentes + (m.total_incidentes || 0),
  }), { horasHombre: 0, incidentesLesion: 0, diasPerdidos: 0, totalIncidentes: 0 })

  const IF = totales.horasHombre > 0
    ? ((totales.incidentesLesion / totales.horasHombre) * 200000).toFixed(2)
    : '0.00'

  const IG = totales.horasHombre > 0
    ? ((totales.diasPerdidos / totales.horasHombre) * 200000).toFixed(2)
    : '0.00'

  // Días sin incidente
  const ultimoConIncidente = [...(metricas ?? [])]
    .reverse()
    .find((m) => m.total_incidentes > 0)

  const diasSinIncidente = ultimoConIncidente
    ? Math.floor((Date.now() - new Date(ultimoConIncidente.fecha).getTime()) / 86400000)
    : metricas?.length ?? 0

  // Datos para el gráfico
  const chartData = (metricas ?? []).slice(-14).map((m) => ({
    fecha: new Date(m.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    Ingresos: m.total_ingresos,
    Egresos: m.total_egresos,
    HH: Number((m.horas_hombre_total || 0).toFixed(1)),
    Incidentes: m.total_incidentes,
  }))

  return (
    <PageLayout title="Estadísticas HSE" subtitle="Índices y tendencias de los últimos 30 días">
      {/* Filtro por equipo */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={equipoId}
          onChange={(e) => setEquipoId(e.target.value)}
          className="text-sm bg-white border border-[rgba(0,0,0,0.1)] rounded-clay-sm py-2 px-3 outline-none focus:border-[#7F77DD] appearance-none"
        >
          <option value="">Todos los equipos</option>
          {(equipos ?? []).map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.nombre_equipo}</option>
          ))}
        </select>
        <span className="text-xs text-[#888780]">Últimos 30 días</span>
      </div>

      {/* Índices HSE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HSEIndexCard
          label="Índice de Frecuencia"
          value={IF}
          desc="IF = (lesiones / HH) × 200.000. Estándar YPF"
          icon={<Activity size={18} className="text-white" />}
          color="bg-[#7F77DD]"
        />
        <HSEIndexCard
          label="Índice de Gravedad"
          value={IG}
          desc="IG = (días perdidos / HH) × 200.000"
          icon={<TrendingDown size={18} className="text-white" />}
          color={Number(IG) > 0 ? 'bg-[#E24B4A]' : 'bg-[#1D9E75]'}
        />
        <HSEIndexCard
          label="Días sin incidente"
          value={String(diasSinIncidente)}
          desc="Desde el último incidente con lesión"
          icon={<Calendar size={18} className="text-white" />}
          color={diasSinIncidente >= 30 ? 'bg-[#1D9E75]' : diasSinIncidente >= 7 ? 'bg-[#BA7517]' : 'bg-[#E24B4A]'}
        />
        <HSEIndexCard
          label="Horas Hombre"
          value={totales.horasHombre.toFixed(0)}
          desc="Total acumulado del período"
          icon={<ShieldCheck size={18} className="text-white" />}
          color="bg-[#534AB7]"
        />
      </div>

      {/* Gráficos */}
      {isLoading ? (
        <div className="grid gap-4"><SkeletonCard /><SkeletonCard /></div>
      ) : (
        <div className="grid gap-4">
          {/* Ingresos y egresos */}
          <Card>
            <h3 className="text-sm font-medium text-[#2C2C2A] mb-4">Ingresos y Egresos — últimos 14 días</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#888780' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888780' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Ingresos" fill="#7F77DD" radius={[4,4,0,0]} />
                <Bar dataKey="Egresos" fill="#1D9E75" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Horas hombre */}
          <Card>
            <h3 className="text-sm font-medium text-[#2C2C2A] mb-4">Horas Hombre acumuladas</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#888780' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888780' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="HH"
                  stroke="#534AB7"
                  strokeWidth={2}
                  dot={false}
                  name="Horas Hombre"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}
