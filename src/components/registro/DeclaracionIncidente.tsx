// src/components/registro/DeclaracionIncidente.tsx
// Replica exactamente el formulario físico "Registro de Visita al Equipo" de Venver
// Sección: "FIRMAR LA COLUMNA QUE CORRESPONDE ANTES DE SALIR"

import { useState } from 'react'
import { FirmaCanvas } from './FirmaCanvas'
import { Button } from '@/components/ui/Button'
import { ShieldCheck, AlertTriangle, Clock, Building2, Briefcase, FileText } from 'lucide-react'

export type DeclaracionResult =
  | { declara: false; firma: string }
  | { declara: true; firma: string }

interface RegistroResumen {
  nombre_completo: string
  dni: string
  empresa?: string
  funcion?: string
  motivo?: string
  fecha_ingreso: string
  equipo?: string
  locacion?: string
}

interface DeclaracionIncidenteProps {
  registro: RegistroResumen
  onConfirm: (result: DeclaracionResult) => void
  isLoading?: boolean
}

function formatHora(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return '—' }
}

export function DeclaracionIncidente({ registro, onConfirm, isLoading }: DeclaracionIncidenteProps) {
  const [columna, setColumna] = useState<'NO' | 'SI' | null>(null)
  const [firma, setFirma] = useState('')

  const puedeConfirmar = columna !== null && firma.length > 0
  const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  const handleConfirmar = () => {
    if (!puedeConfirmar) return
    onConfirm({ declara: columna === 'SI', firma })
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      {/* ── Resumen del registro — replica el encabezado del formulario físico ── */}
      <div className="card-clay p-4 space-y-2.5">
        {/* Encabezado tipo formulario */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--divider)]">
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Registro de Visita al Equipo
            </p>
            {registro.equipo && (
              <p className="text-xs text-[var(--text-faded)] mt-0.5">
                {registro.equipo}{registro.locacion ? ` — ${registro.locacion}` : ''}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">{formatFecha(registro.fecha_ingreso)}</p>
          </div>
        </div>

        {/* Datos del visitante */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="col-span-2">
            <p className="text-[10px] text-[var(--text-faded)] uppercase tracking-wide">Apellido, Nombre</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{registro.nombre_completo}</p>
          </div>

          {registro.empresa && (
            <div className="col-span-2">
              <p className="text-[10px] text-[var(--text-faded)] uppercase tracking-wide">Empresa / Entidad</p>
              <p className="text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                <Building2 size={12} className="text-[var(--text-muted)]" />
                {registro.empresa}
              </p>
            </div>
          )}

          {registro.funcion && (
            <div>
              <p className="text-[10px] text-[var(--text-faded)] uppercase tracking-wide">Función</p>
              <p className="text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                <Briefcase size={12} className="text-[var(--text-muted)]" />
                {registro.funcion}
              </p>
            </div>
          )}

          {registro.motivo && (
            <div>
              <p className="text-[10px] text-[var(--text-faded)] uppercase tracking-wide">Motivo de visita</p>
              <p className="text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                <FileText size={12} className="text-[var(--text-muted)]" />
                {registro.motivo}
              </p>
            </div>
          )}

          {/* Horas */}
          <div>
            <p className="text-[10px] text-[var(--text-faded)] uppercase tracking-wide">Hora de llegada</p>
            <p className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1.5">
              <Clock size={12} className="text-[var(--text-muted)]" />
              {formatHora(registro.fecha_ingreso)}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-[var(--text-faded)] uppercase tracking-wide">Hora de salida</p>
            <p className="text-sm font-medium text-[#1D9E75] flex items-center gap-1.5">
              <Clock size={12} className="text-[#1D9E75]" />
              {horaActual}
            </p>
          </div>
        </div>
      </div>

      {/* ── Sección de declaración — replica exactamente el formulario ── */}
      <div>
        <p className="text-xs font-semibold text-center text-[var(--text-secondary)] uppercase tracking-wide mb-3">
          Firmar la columna que corresponde antes de salir
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Columna NO */}
          <button
            type="button"
            onClick={() => { setColumna('NO'); setFirma('') }}
            className={[
              'flex flex-col items-start gap-2 p-4 rounded-clay border-2 transition-all duration-150 text-left',
              columna === 'NO'
                ? 'border-[#1D9E75] bg-[#1D9E75]/5'
                : 'border-[var(--border-strong)] bg-[var(--card-bg)] hover:border-[#1D9E75]/40',
            ].join(' ')}
          >
            <div className={[
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors self-center',
              columna === 'NO' ? 'bg-[#1D9E75] text-white' : 'bg-[#1D9E75]/10 text-[#1D9E75]',
            ].join(' ')}>
              <ShieldCheck size={20} />
            </div>
            <div className="self-center text-center">
              <p className="font-bold text-[var(--text-primary)] text-base">NO</p>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-snug text-center w-full">
              No ha sufrido ningún incidente
            </p>
          </button>

          {/* Columna SÍ */}
          <button
            type="button"
            onClick={() => { setColumna('SI'); setFirma('') }}
            className={[
              'flex flex-col items-start gap-2 p-4 rounded-clay border-2 transition-all duration-150 text-left',
              columna === 'SI'
                ? 'border-[#E24B4A] bg-[#E24B4A]/5'
                : 'border-[var(--border-strong)] bg-[var(--card-bg)] hover:border-[#E24B4A]/40',
            ].join(' ')}
          >
            <div className={[
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors self-center',
              columna === 'SI' ? 'bg-[#E24B4A] text-white' : 'bg-[#E24B4A]/10 text-[#E24B4A]',
            ].join(' ')}>
              <AlertTriangle size={20} />
            </div>
            <div className="self-center text-center">
              <p className="font-bold text-[var(--text-primary)] text-base">SÍ</p>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-snug text-center w-full">
              He estado involucrado en un incidente o sufrí una lesión — se informó al Jefe de Equipo/Encargado de Turno
            </p>
          </button>
        </div>
      </div>

      {/* ── Pad de firma — aparece al elegir columna ── */}
      {columna && (
        <div className="animate-slide-up space-y-3">
          <div className={[
            'px-4 py-3 rounded-clay-sm text-sm',
            columna === 'SI'
              ? 'bg-[#E24B4A]/8 border border-[#E24B4A]/20 text-[#b93332]'
              : 'bg-[#1D9E75]/8 border border-[#1D9E75]/20 text-[#0F6E56]',
          ].join(' ')}>
            {columna === 'SI'
              ? '⚠️ A continuación completar el detalle del incidente.'
              : '✓ Firmar para confirmar el egreso sin incidentes.'
            }
          </div>

          <FirmaCanvas
            onFirma={setFirma}
            label={columna === 'NO' ? 'Firma — Columna NO' : 'Firma — Columna SÍ'}
            height={160}
            required
          />
        </div>
      )}

      {/* ── Botón confirmar ── */}
      <Button
        onClick={handleConfirmar}
        loading={isLoading}
        disabled={!puedeConfirmar}
        variant={columna === 'SI' ? 'danger' : 'salida'}
        size="lg"
        fullWidth
      >
        {columna === 'SI' ? 'Continuar — Registrar Incidente' : 'Confirmar Egreso'}
      </Button>
    </div>
  )
}
