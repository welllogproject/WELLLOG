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
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useEquipos } from '@/hooks/useEquipos'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'

function HSEIndexCard({
  label, value, desc, icon, color,
}: { label: string; value: string; desc: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-medium text-[var(--text-primary)]">{value}</p>
        <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{label}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1 leading-snug">{desc}</p>
      </div>
    </Card>
  )
}

export function EstadisticasHSE() {
  const { usuario } = useAuthStore()
  const { data: equipos } = useEquipos()
  const [equipoId, setEquipoId] = useState('')

  const hace30 = new Date()
  hace30.setDate(hace30.getDate() - 30)
  const desde = hace30.toISOString().split('T')[0]

  const { data: metricas, isLoading } = useQuery({
    queryKey: ['metricas', usuario?.empresa_id, equipoId, 'hse'],
    queryFn: async () => {
      let q = supabase
        .from('metricas_diarias')
        .select('*')
        .gte('fecha', desde)
        .order('fecha')
      if (equipoId) q = q.eq('equipo_id', equipoId)
      const { data } = await q
      return data ?? []
    },
    enabled: !!usuario,
  })

  // Días perdidos reales desde tabla incidentes (para IG correcto)
  const { data: diasPerdidosData } = useQuery({
    queryKey: ['hse', 'dias-perdidos', usuario?.empresa_id, equipoId],
    queryFn: async () => {
      if (!usuario?.empresa_id) return 0

      // Obtener equipos de la empresa
      const equipoIds = equipoId
        ? [equipoId]
        : (equipos ?? []).map((e) => e.id)

      if (equipoIds.length === 0) return 0

      const { data } = await supabase
        .from('incidentes')
        .select('dias_perdidos')
        .in('equipo_id', equipoIds)
        .gte('fecha_incidente', `${desde}T00:00:00`)

      return (data ?? []).reduce((sum, i) => sum + (i.dias_perdidos ?? 0), 0)
    },
    enabled: !!usuario && !isLoading,
  })

  // Último incidente con lesión (para días sin incidente)
  const { data: ultimaLesion } = useQuery({
    queryKey: ['hse', 'ultima-lesion', usuario?.empresa_id, equipoId],
    queryFn: async () => {
      if (!usuario?.empresa_id) return null
      const equipoIds = equipoId
        ? [equipoId]
        : (equipos ?? []).map((e) => e.id)
      if (equipoIds.length === 0) return null

      const { data } = await supabase
        .from('incidentes')
        .select('fecha_incidente')
        .in('equipo_id', equipoIds)
        .eq('tipo', 'lesion')
        .order('fecha_incidente', { ascending: false })
        .limit(1)
        .maybeSingle()

      return data?.fecha_incidente ?? null
    },
    enabled: !!usuario,
  })

  const totales = (metricas ?? []).reduce((acc, m) => ({
    horasHombre: acc.horasHombre + (m.horas_hombre_total || 0),
    incidentesLesion: acc.incidentesLesion + (m.incidentes_lesion || 0),
    totalIncidentes: acc.totalIncidentes + (m.total_incidentes || 0),
  }), { horasHombre: 0, incidentesLesion: 0, totalIncidentes: 0 })

  const diasPerdidos = diasPerdidosData ?? 0

  const IF = totales.horasHombre > 0
    ? ((totales.incidentesLesion / totales.horasHombre) * 200000).toFixed(2)
    : '0.00'

  const IG = totales.horasHombre > 0
    ? ((diasPerdidos / totales.horasHombre) * 200000).toFixed(2)
    : '0.00'

  const diasSinIncidente = ultimaLesion
    ? Math.floor((Date.now() - new Date(ultimaLesion).getTime()) / 86400000)
    : 30 // Si no hay lesiones en el período, son al menos 30 días

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
          className="text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm py-2 px-3 outline-none focus:border-[#7F77DD] appearance-none"
        >
          <option value="">Todos los equipos</option>
          {(equipos ?? []).map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.nombre_equipo}</option>
          ))}
        </select>
        <span className="text-xs text-[var(--text-muted)]">Últimos 30 días</span>
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
          label="Días sin lesión"
          value={String(diasSinIncidente)}
          desc="Desde la última lesión registrada"
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
          <Card>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Ingresos y Egresos — últimos 14 días</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#888780' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888780' }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Ingresos" fill="#7F77DD" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Egresos" fill="#1D9E75" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Horas Hombre acumuladas</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#888780' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888780' }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
                <Line type="monotone" dataKey="HH" stroke="#534AB7" strokeWidth={2} dot={false} name="Horas Hombre" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}
