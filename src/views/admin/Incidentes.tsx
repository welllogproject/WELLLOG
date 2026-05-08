// src/views/admin/Incidentes.tsx
// Gestión de declaraciones e investigaciones de incidentes

import { useState } from 'react'
import { useIncidentes, useCerrarIncidente } from '@/hooks/useIncidentes'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { AlertTriangle, Clock, User, Building2, CheckCircle2 } from 'lucide-react'

const GRAVEDAD_CONFIG = {
  leve:     { color: 'bg-[#888780]/10 text-[#5F5E5A]', label: 'Leve' },
  moderado: { color: 'bg-[#BA7517]/10 text-[#7A4E0F]', label: 'Moderado' },
  grave:    { color: 'bg-[#E24B4A]/15 text-[#b93332]', label: 'Grave' },
  critico:  { color: 'bg-[#E24B4A]/25 text-[#b93332] font-semibold', label: '🚨 Crítico' },
}

export function Incidentes() {
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const { data: incidentes, isLoading } = useIncidentes(undefined, filtroEstado || undefined)
  const cerrarIncidente = useCerrarIncidente()

  const [incidenteSeleccionado, setIncidenteSeleccionado] = useState<string | null>(null)
  const [conclusion, setConclusion] = useState('')
  const [acciones, setAcciones] = useState('')

  const handleCerrar = async () => {
    if (!incidenteSeleccionado || !conclusion.trim()) return
    await cerrarIncidente.mutateAsync({
      incidenteId: incidenteSeleccionado,
      conclusion,
      acciones,
    })
    setIncidenteSeleccionado(null)
    setConclusion('')
    setAcciones('')
  }

  return (
    <PageLayout
      title="Incidentes HSE"
      subtitle={`${incidentes?.length ?? 0} incidente${incidentes?.length !== 1 ? 's' : ''}`}
    >
      {/* Filtro de estado */}
      <div className="flex gap-2 mb-4">
        {[
          { value: '', label: 'Todos' },
          { value: 'pendiente', label: 'Pendientes' },
          { value: 'investigando', label: 'Investigando' },
          { value: 'cerrado', label: 'Cerrados' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroEstado(f.value)}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              filtroEstado === f.value
                ? 'bg-[#7F77DD] text-white'
                : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#5F5E5A] hover:bg-gray-50',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de incidentes */}
      {isLoading ? (
        <div className="grid gap-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (incidentes ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-[#1D9E75]" />
          </div>
          <p className="text-sm text-[#888780]">Sin incidentes para mostrar</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {(incidentes ?? []).map((inc) => (
            <Card key={inc.id} hover onClick={() => setIncidenteSeleccionado(inc.id)}>
              <div className="flex items-start justify-between gap-4">
                {/* Ícono de gravedad */}
                <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 ${
                  inc.gravedad === 'critico' ? 'bg-[#E24B4A]' : 'bg-[#E24B4A]/10'
                }`}>
                  <AlertTriangle size={18} className={inc.gravedad === 'critico' ? 'text-white' : 'text-[#E24B4A]'} />
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${GRAVEDAD_CONFIG[inc.gravedad]?.color}`}>
                      {GRAVEDAD_CONFIG[inc.gravedad]?.label}
                    </span>
                    <Badge variant={inc.estado as 'pendiente' | 'investigando' | 'cerrado'} showDot>
                      {inc.estado === 'pendiente' ? 'Pendiente' : inc.estado === 'investigando' ? 'Investigando' : 'Cerrado'}
                    </Badge>
                  </div>

                  <p className="font-medium text-[#2C2C2A] truncate">{inc.nombre_afectado}</p>
                  <p className="text-sm text-[#5F5E5A] mt-0.5 line-clamp-2">{inc.descripcion}</p>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-[#888780]">
                      <User size={11} /> {inc.funcion_afectado || 'Sin función'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#888780]">
                      <Building2 size={11} /> {inc.empresa_afectado || 'Sin empresa'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#AAAAAA]">
                      <Clock size={11} />
                      {new Date(inc.fecha_incidente).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para cerrar incidente */}
      <Modal
        isOpen={!!incidenteSeleccionado}
        onClose={() => setIncidenteSeleccionado(null)}
        title="Cerrar Investigación"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-[#2C2C2A] block mb-1.5">
              Conclusión de la investigación <span className="text-[#E24B4A]">*</span>
            </label>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              rows={4}
              placeholder="Describí las causas raíz y el análisis de la investigación..."
              className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-clay-sm text-sm py-2.5 px-4 outline-none focus:border-[#7F77DD] resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#2C2C2A] block mb-1.5">
              Acciones correctivas
            </label>
            <textarea
              value={acciones}
              onChange={(e) => setAcciones(e.target.value)}
              rows={3}
              placeholder="Medidas implementadas para prevenir recurrencia..."
              className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-clay-sm text-sm py-2.5 px-4 outline-none focus:border-[#7F77DD] resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setIncidenteSeleccionado(null)}>
              Cancelar
            </Button>
            <Button
              variant="salida"
              fullWidth
              loading={cerrarIncidente.isPending}
              disabled={!conclusion.trim()}
              onClick={handleCerrar}
            >
              Cerrar Incidente
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  )
}
