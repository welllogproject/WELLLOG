// src/components/registro/FormIncidente.tsx
// Formulario de detalle del incidente (cuando declara SÍ)

import { useState } from 'react'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FirmaCanvas } from './FirmaCanvas'
import type { FormIncidenteData, TipoIncidente, GravedadIncidente } from '@/types/models'

interface FormIncidenteProps {
  onSubmit: (data: FormIncidenteData) => void
  isLoading?: boolean
}

const TIPOS: { value: TipoIncidente; label: string }[] = [
  { value: 'lesion', label: 'Lesión personal' },
  { value: 'accidente', label: 'Accidente' },
  { value: 'casi_accidente', label: 'Casi accidente' },
  { value: 'dano_material', label: 'Daño material' },
  { value: 'enfermedad', label: 'Enfermedad ocupacional' },
  { value: 'otro', label: 'Otro' },
]

const GRAVEDADES: { value: GravedadIncidente; label: string }[] = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'grave', label: 'Grave' },
  { value: 'critico', label: 'Crítico' },
]

export function FormIncidente({ onSubmit, isLoading }: FormIncidenteProps) {
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState<TipoIncidente>('accidente')
  const [gravedad, setGravedad] = useState<GravedadIncidente>('leve')
  const [diasPerdidos, setDiasPerdidos] = useState(0)
  const [informoJefe, setInformoJefe] = useState(false)
  const [jefeNombre, setJefeNombre] = useState('')
  const [firmaJefe, setFirmaJefe] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!descripcion.trim()) e.descripcion = 'Descripción requerida'
    if (!tipo) e.tipo = 'Seleccioná el tipo'
    if (informoJefe && !jefeNombre.trim()) e.jefeNombre = 'Nombre del jefe requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      descripcion,
      tipo,
      gravedad,
      dias_perdidos: diasPerdidos,
      informo_jefe_turno: informoJefe,
      jefe_turno_nombre: jefeNombre || undefined,
      firma_jefe_data: firmaJefe || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="bg-[#E24B4A]/8 text-[#b93332] rounded-clay-sm p-3 text-sm">
        ⚠️ Completá los datos del incidente. El administrador será notificado automáticamente.
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5">
          Descripción del incidente <span className="text-[#E24B4A]">*</span>
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          placeholder="Describí brevemente qué ocurrió..."
          className={[
            'w-full bg-[var(--card-bg)] border rounded-clay-sm text-sm py-2.5 px-4 outline-none transition-all resize-none',
            errors.descripcion
              ? 'border-[#E24B4A] focus:ring-2 focus:ring-[#E24B4A]/20'
              : 'border-[var(--border-strong)] focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15',
          ].join(' ')}
        />
        {errors.descripcion && <p className="text-xs text-[#E24B4A] mt-1">{errors.descripcion}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Tipo de incidente"
          options={TIPOS}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoIncidente)}
          required
        />
        <Select
          label="Gravedad"
          options={GRAVEDADES}
          value={gravedad}
          onChange={(e) => setGravedad(e.target.value as GravedadIncidente)}
          required
        />
      </div>

      <Input
        label="Días perdidos estimados"
        type="number"
        min={0}
        max={365}
        value={diasPerdidos}
        onChange={(e) => setDiasPerdidos(parseInt(e.target.value) || 0)}
        hint="0 si no hay días perdidos aún"
      />

      {/* ¿Informó al jefe de turno? */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setInformoJefe(!informoJefe)}
            className={[
              'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
              informoJefe ? 'bg-[#1D9E75]' : 'bg-[#D1D0CE]',
            ].join(' ')}
          >
            <span className={[
              'absolute top-0.5 w-5 h-5 bg-[var(--card-bg)] rounded-full shadow transition-transform duration-200',
              informoJefe ? 'translate-x-5' : 'translate-x-0.5',
            ].join(' ')} />
          </button>
          <label className="text-sm font-medium text-[var(--text-primary)]">
            ¿Informó al Jefe de Turno?
          </label>
        </div>

        {informoJefe && (
          <div className="animate-slide-up space-y-4 pl-14">
            <Input
              label="Nombre del Jefe de Turno"
              value={jefeNombre}
              onChange={(e) => setJefeNombre(e.target.value)}
              placeholder="Apellido y Nombre"
              error={errors.jefeNombre}
              required
            />
            <FirmaCanvas
              onFirma={setFirmaJefe}
              label="Firma del Jefe de Turno (opcional)"
              height={120}
            />
          </div>
        )}
      </div>

      <Button type="submit" variant="danger" size="lg" fullWidth loading={isLoading}>
        Confirmar y Registrar Incidente
      </Button>
    </form>
  )
}
