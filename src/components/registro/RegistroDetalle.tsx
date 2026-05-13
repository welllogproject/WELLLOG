// src/components/registro/RegistroDetalle.tsx
// Drawer lateral con el detalle completo de un registro de acceso

import { useEffect, useState } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import type { RegistroAcceso } from '@/types/models'
import {
  User, Building2, Briefcase, MapPin, Clock, FileText,
  Car, AlertTriangle, PenTool, Calendar, Shield,
} from 'lucide-react'

interface Props {
  registro: RegistroAcceso | null
  isOpen: boolean
  onClose: () => void
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-7 h-7 rounded-[8px] bg-[var(--hover-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">{label}</p>
        <div className="text-sm text-[var(--text-primary)] mt-0.5">{value}</div>
      </div>
    </div>
  )
}

function FirmaMiniatura({ data, label }: { data?: string | null; label: string }) {
  if (!data) return null
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">{label}</p>
      <div className="w-full h-20 bg-white border border-[var(--border)] rounded-[10px] overflow-hidden flex items-center justify-center">
        <img
          src={data.startsWith('data:') ? data : `data:image/svg+xml;base64,${data}`}
          alt={label}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  )
}

function formatFecha(fecha: string | undefined | null): string {
  if (!fecha) return '—'
  try {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return fecha
  }
}

function calcularPermanencia(ingreso: string, egreso?: string | null): string {
  if (!egreso) return 'Aún dentro'
  const diff = new Date(egreso).getTime() - new Date(ingreso).getTime()
  const horas = Math.floor(diff / 3600000)
  const minutos = Math.floor((diff % 3600000) / 60000)
  if (horas === 0) return `${minutos} min`
  return `${horas}h ${minutos}min`
}

// Hook para resolver nombres de usuario a partir de UUIDs
function useUsuarioNombres(ids: (string | undefined | null)[]) {
  const [nombres, setNombres] = useState<Record<string, string>>({})

  useEffect(() => {
    const idsValidos = ids.filter((id): id is string => !!id)
    if (idsValidos.length === 0) return

    // No re-fetch si ya tenemos todos los nombres
    const faltantes = idsValidos.filter((id) => !nombres[id])
    if (faltantes.length === 0) return

    supabase
      .from('usuarios')
      .select('id, nombre_completo, email, rol')
      .in('id', faltantes)
      .then(({ data }) => {
        if (!data) return
        const mapa: Record<string, string> = { ...nombres }
        data.forEach((u) => {
          mapa[u.id] = `${u.nombre_completo} (${u.rol})`
        })
        setNombres(mapa)
      })
  }, [ids.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  return nombres
}

export function RegistroDetalle({ registro, isOpen, onClose }: Props) {
  if (!registro) return null

  const permanencia = calcularPermanencia(registro.fecha_ingreso, registro.fecha_egreso)

  // Resolver nombres de los usuarios que registraron/actualizaron
  const nombres = useUsuarioNombres([
    registro.registrado_por_usuario_id,
    registro.actualizado_por_usuario_id,
  ])

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={registro.nombre_completo}
      subtitle={`DNI ${registro.dni} · ${registro.estado === 'dentro' ? 'Actualmente dentro' : 'Egresó'}`}
      width="md"
    >
      {/* Estado */}
      <div className="flex items-center gap-2 mb-5">
        <Badge
          variant={registro.estado === 'dentro' ? 'dentro' : registro.estado === 'anulado' ? 'danger' : 'afuera'}
          showDot
          size="sm"
        >
          {registro.estado === 'dentro' ? 'Dentro' : registro.estado === 'anulado' ? 'Anulado' : 'Afuera'}
        </Badge>
        {registro.declara_incidente && (
          <Badge variant="danger" size="sm">
            <AlertTriangle size={10} className="mr-1" />
            Declaró incidente
          </Badge>
        )}
        {registro.declara_incidente === false && (
          <Badge variant="activo" size="sm">Sin incidente</Badge>
        )}
      </div>

      {/* Datos personales */}
      <section className="mb-5">
        <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">
          Datos del visitante
        </h3>
        <div className="card-clay p-4 space-y-0 divide-y divide-[var(--divider)]">
          <InfoRow
            icon={<User size={13} className="text-[var(--text-muted)]" />}
            label="Nombre completo"
            value={registro.nombre_completo}
          />
          <InfoRow
            icon={<FileText size={13} className="text-[var(--text-muted)]" />}
            label="Documento"
            value={`${registro.tipo_documento || 'DNI'} ${registro.dni}`}
          />
          <InfoRow
            icon={<Building2 size={13} className="text-[var(--text-muted)]" />}
            label="Empresa"
            value={registro.empresa_visitante_nombre || '—'}
          />
          <InfoRow
            icon={<Briefcase size={13} className="text-[var(--text-muted)]" />}
            label="Función"
            value={registro.funcion_visitante || '—'}
          />
          <InfoRow
            icon={<MapPin size={13} className="text-[var(--text-muted)]" />}
            label="Motivo de visita"
            value={registro.motivo_visita}
          />
          {registro.vehiculo_patente && (
            <InfoRow
              icon={<Car size={13} className="text-[var(--text-muted)]" />}
              label="Vehículo"
              value={registro.vehiculo_patente}
            />
          )}
        </div>
      </section>

      {/* Tiempos */}
      <section className="mb-5">
        <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">
          Tiempos
        </h3>
        <div className="card-clay p-4 space-y-0 divide-y divide-[var(--divider)]">
          <InfoRow
            icon={<Clock size={13} className="text-[#1D9E75]" />}
            label="Ingreso"
            value={formatFecha(registro.fecha_ingreso)}
          />
          <InfoRow
            icon={<Clock size={13} className="text-[#7F77DD]" />}
            label="Egreso"
            value={registro.fecha_egreso ? formatFecha(registro.fecha_egreso) : 'Aún dentro'}
          />
          <InfoRow
            icon={<Calendar size={13} className="text-[var(--text-muted)]" />}
            label="Permanencia"
            value={permanencia}
          />
        </div>
      </section>

      {/* Firmas */}
      {(registro.firma_ingreso_data || registro.firma_egreso_data || registro.firma_declaracion_data) && (
        <section className="mb-5">
          <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            Firmas
          </h3>
          <div className="card-clay p-4 space-y-4">
            <FirmaMiniatura data={registro.firma_ingreso_data} label="Firma de ingreso" />
            <FirmaMiniatura data={registro.firma_egreso_data} label="Firma de egreso" />
            <FirmaMiniatura data={registro.firma_declaracion_data} label="Firma declaración (sin incidente)" />
          </div>
        </section>
      )}

      {/* Declaración de incidente */}
      {registro.declara_incidente !== null && registro.declara_incidente !== undefined && (
        <section className="mb-5">
          <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            Declaración de incidente
          </h3>
          <div className={[
            'card-clay p-4 border-l-4',
            registro.declara_incidente ? 'border-l-[#E24B4A]' : 'border-l-[#1D9E75]',
          ].join(' ')}>
            <div className="flex items-center gap-2">
              {registro.declara_incidente ? (
                <>
                  <AlertTriangle size={14} className="text-[#E24B4A]" />
                  <span className="text-sm font-medium text-[#b93332]">
                    SÍ — Declaró incidente al egreso
                  </span>
                </>
              ) : (
                <>
                  <PenTool size={14} className="text-[#1D9E75]" />
                  <span className="text-sm font-medium text-[#0F6E56]">
                    NO — Sin incidentes durante la visita
                  </span>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* GPS */}
      {registro.ubicacion_ingreso && (
        <section className="mb-5">
          <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            Geolocalización
          </h3>
          <div className="card-clay p-4">
            <p className="text-xs text-[var(--text-secondary)]">
              📍 Ubicación de ingreso capturada
              {registro.precision_metros_ingreso && (
                <span className="text-[var(--text-muted)]"> (precisión ±{registro.precision_metros_ingreso}m)</span>
              )}
            </p>
          </div>
        </section>
      )}

      {/* Auditoría */}
      <section>
        <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">
          Auditoría
        </h3>
        <div className="card-clay p-4 space-y-0 divide-y divide-[var(--divider)]">
          <InfoRow
            icon={<Shield size={13} className="text-[var(--text-muted)]" />}
            label="Registrado por"
            value={nombres[registro.registrado_por_usuario_id] || 'Cargando...'}
          />
          {registro.actualizado_por_usuario_id && (
            <InfoRow
              icon={<Shield size={13} className="text-[var(--text-muted)]" />}
              label="Actualizado por"
              value={nombres[registro.actualizado_por_usuario_id] || 'Cargando...'}
            />
          )}
          <InfoRow
            icon={<Calendar size={13} className="text-[var(--text-muted)]" />}
            label="Fecha de creación"
            value={formatFecha(registro.created_at)}
          />
          {registro.motivo_anulacion && (
            <InfoRow
              icon={<AlertTriangle size={13} className="text-[#E24B4A]" />}
              label="Motivo de anulación"
              value={<span className="text-[#E24B4A]">{registro.motivo_anulacion}</span>}
            />
          )}
        </div>
        <p className="text-[10px] text-[var(--text-faded)] mt-2 font-mono">
          ID: {registro.id}
        </p>
      </section>
    </Drawer>
  )
}
