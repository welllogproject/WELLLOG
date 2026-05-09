// src/components/registro/DeclaracionIncidente.tsx
// Pantalla obligatoria al egreso — columna NO / columna SÍ
// Replicar exactamente el formulario físico de Venver

import { useState } from 'react'
import { FirmaCanvas } from './FirmaCanvas'
import { Button } from '@/components/ui/Button'
import { ShieldCheck, AlertTriangle } from 'lucide-react'

export type DeclaracionResult =
  | { declara: false; firma: string }
  | { declara: true; firma: string }

interface DeclaracionIncidenteProps {
  personaNombre: string
  onConfirm: (result: DeclaracionResult) => void
  isLoading?: boolean
}

export function DeclaracionIncidente({ personaNombre, onConfirm, isLoading }: DeclaracionIncidenteProps) {
  const [columna, setColumna] = useState<'NO' | 'SI' | null>(null)
  const [firma, setFirma] = useState('')

  const puedeConfirmar = columna !== null && firma.length > 0

  const handleConfirmar = () => {
    if (!puedeConfirmar) return
    onConfirm({ declara: columna === 'SI', firma })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Encabezado */}
      <div className="text-center">
        <h2 className="text-lg font-medium text-[var(--text-primary)]">Declaración de Incidente</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          <span className="font-medium">{personaNombre}</span> — firmá la columna que corresponde antes de salir
        </p>
      </div>

      {/* Las dos columnas */}
      <div className="grid grid-cols-2 gap-3">
        {/* Columna NO */}
        <button
          type="button"
          onClick={() => setColumna('NO')}
          className={[
            'flex flex-col items-center gap-3 p-4 rounded-clay border-2 transition-all duration-150',
            columna === 'NO'
              ? 'border-[#1D9E75] bg-[#1D9E75]/5'
              : 'border-[var(--border-strong)] bg-[var(--card-bg)] hover:border-[#1D9E75]/50',
          ].join(' ')}
        >
          <div className={[
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            columna === 'NO' ? 'bg-[#1D9E75] text-white' : 'bg-[#1D9E75]/10 text-[#1D9E75]',
          ].join(' ')}>
            <ShieldCheck size={24} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--text-primary)] text-sm">NO</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-snug">
              No he sufrido ningún incidente
            </p>
          </div>
        </button>

        {/* Columna SÍ */}
        <button
          type="button"
          onClick={() => setColumna('SI')}
          className={[
            'flex flex-col items-center gap-3 p-4 rounded-clay border-2 transition-all duration-150',
            columna === 'SI'
              ? 'border-[#E24B4A] bg-[#E24B4A]/5'
              : 'border-[var(--border-strong)] bg-[var(--card-bg)] hover:border-[#E24B4A]/50',
          ].join(' ')}
        >
          <div className={[
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            columna === 'SI' ? 'bg-[#E24B4A] text-white' : 'bg-[#E24B4A]/10 text-[#E24B4A]',
          ].join(' ')}>
            <AlertTriangle size={24} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--text-primary)] text-sm">SÍ</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-snug">
              Estuve involucrado en un incidente
            </p>
          </div>
        </button>
      </div>

      {/* Pad de firma (aparece cuando eligió columna) */}
      {columna && (
        <div className="animate-slide-up">
          <div className={[
            'p-3 rounded-clay-sm mb-3 text-xs',
            columna === 'SI' ? 'bg-[#E24B4A]/8 text-[#b93332]' : 'bg-[#1D9E75]/8 text-[#0F6E56]',
          ].join(' ')}>
            {columna === 'SI'
              ? '⚠️ Se informó al Jefe de Equipo. A continuación completar detalle del incidente.'
              : '✓ No hubo incidente. Firmar para confirmar el egreso.'
            }
          </div>
          <FirmaCanvas
            onFirma={setFirma}
            label="Firma del visitante"
            height={140}
            required
          />
        </div>
      )}

      {/* Botón confirmar */}
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
