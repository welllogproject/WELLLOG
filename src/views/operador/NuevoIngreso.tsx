// src/views/operador/NuevoIngreso.tsx
// Flujo completo: DNI → Autocomplete → Confirmar → Firma → Éxito
// Máximo 4 toques, máximo 60 segundos

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useHistorialDNI, useTieneIngresoActivo, useNuevoIngreso } from '@/hooks/useRegistros'
import { useEquipo } from '@/hooks/useEquipos'
import { useGPS } from '@/hooks/useGPS'
import { TabletLayout } from '@/components/layout/TabletLayout'
import { DNIInput } from '@/components/registro/DNIInput'
import { FirmaCanvas } from '@/components/registro/FirmaCanvas'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MOTIVOS_VISITA, type MotivoVisita } from '@/types/roles'
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

type Paso = 'dni' | 'confirmar' | 'firma' | 'exito'

interface DatosIngreso {
  dni: string
  nombre_completo: string
  empresa: string
  funcion: string
  motivo: MotivoVisita
  patente: string
}

export function NuevoIngreso() {
  const navigate = useNavigate()
  const { equipoId } = useAuthStore()
  const { data: equipo } = useEquipo(equipoId)
  const { capturar: capturarGPS } = useGPS()
  const nuevoIngreso = useNuevoIngreso()

  const [paso, setPaso] = useState<Paso>('dni')
  const [dni, setDni] = useState('')
  const [firma, setFirma] = useState('')
  const [datos, setDatos] = useState<DatosIngreso>({
    dni: '',
    nombre_completo: '',
    empresa: '',
    funcion: '',
    motivo: 'Trabajo en Pozo',
    patente: '',
  })

  const { data: historial } = useHistorialDNI(equipoId)
  const { data: ingresoActivo } = useTieneIngresoActivo(dni, equipoId)

  // Autocomplete desde historial
  const autocompletar = (dniBuscado: string) => {
    const encontrado = historial?.find((h) => h.dni === dniBuscado)
    if (encontrado) {
      setDatos((prev) => ({
        ...prev,
        dni: dniBuscado,
        nombre_completo: encontrado.nombre_completo || '',
        empresa: encontrado.empresa_visitante_nombre || '',
        funcion: encontrado.funcion_visitante || '',
      }))
    } else {
      setDatos((prev) => ({ ...prev, dni: dniBuscado, nombre_completo: '', empresa: '', funcion: '' }))
    }
  }

  const handleDniConfirmar = () => {
    if (ingresoActivo) {
      toast.error(`${ingresoActivo.nombre_completo} ya está registrado como DENTRO`)
      return
    }
    autocompletar(dni)
    setPaso('confirmar')
  }

  const handleConfirmarDatos = () => {
    if (!datos.nombre_completo.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    if (!datos.motivo) {
      toast.error('Seleccioná el motivo de visita')
      return
    }
    // Capturar GPS en silencio
    capturarGPS()
    setPaso('firma')
  }

  const handleFirmaCompleta = async () => {
    if (!firma) {
      toast.error('La firma es requerida')
      return
    }

    await nuevoIngreso.mutateAsync({
      dni,
      tipo_documento: 'DNI',
      nombre_completo: datos.nombre_completo,
      empresa_visitante_nombre: datos.empresa,
      funcion_visitante: datos.funcion,
      motivo_visita: datos.motivo,
      vehiculo_patente: datos.patente || undefined,
      firma_data: firma,
    })

    setPaso('exito')
    // Volver automáticamente en 2 segundos
    setTimeout(() => navigate('/operador'), 2000)
  }

  return (
    <TabletLayout equipoNombre={equipo?.nombre_equipo} locacionCodigo={equipo?.locacion?.codigo}>
      {/* Header con paso */}
      <div className="bg-[var(--card-bg)] border-b border-[var(--divider)] px-5 py-3 flex items-center gap-3">
        {paso !== 'exito' && (
          <button
            onClick={() => paso === 'dni' ? navigate('/operador') : setPaso(paso === 'firma' ? 'confirmar' : 'dni')}
            className="p-1.5 rounded-full hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-secondary)]"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h2 className="text-base font-medium text-[var(--text-primary)]">
          {paso === 'dni' ? 'Nuevo Ingreso — DNI' :
           paso === 'confirmar' ? 'Confirmar Datos' :
           paso === 'firma' ? 'Firma de Ingreso' :
           'Ingreso Registrado'}
        </h2>
        {/* Indicador de pasos */}
        {paso !== 'exito' && (
          <div className="ml-auto flex gap-1">
            {(['dni', 'confirmar', 'firma'] as const).map((p, i) => (
              <div
                key={p}
                className={`w-2 h-2 rounded-full transition-colors ${
                  paso === p ? 'bg-[#7F77DD]' :
                  ['dni', 'confirmar', 'firma'].indexOf(paso) > i ? 'bg-[#1D9E75]' : 'bg-[#DDDDDD]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contenido por paso */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* PASO 1: DNI */}
        {paso === 'dni' && (
          <div className="animate-fade-in">
            <DNIInput
              value={dni}
              onChange={setDni}
              onConfirm={handleDniConfirmar}
              error={ingresoActivo ? `${ingresoActivo.nombre_completo} ya está DENTRO` : undefined}
              isLoading={false}
            />
          </div>
        )}

        {/* PASO 2: Confirmar datos */}
        {paso === 'confirmar' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {historial?.find((h) => h.dni === dni) && (
              <div className="bg-[#7F77DD]/8 text-[#534AB7] px-3 py-2.5 rounded-clay-sm text-sm flex items-center gap-2">
                <CheckCircle2 size={16} />
                Datos autocomplete del historial — revisá y confirmá
              </div>
            )}

            {/* DNI (readonly) */}
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] block mb-1">DNI</label>
              <div className="bg-[#F0EFED] border border-[var(--border)] rounded-clay-sm px-4 py-2.5 text-sm text-[var(--text-secondary)] font-mono">
                {dni}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] block mb-1">
                Nombre y Apellido <span className="text-[#E24B4A]">*</span>
              </label>
              <input
                type="text"
                value={datos.nombre_completo}
                onChange={(e) => setDatos((d) => ({ ...d, nombre_completo: e.target.value }))}
                placeholder="Apellido y Nombre"
                className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm text-sm py-2.5 px-4 outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1">Empresa</label>
                <input
                  type="text"
                  value={datos.empresa}
                  onChange={(e) => setDatos((d) => ({ ...d, empresa: e.target.value }))}
                  placeholder="Nombre de empresa"
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm text-sm py-2.5 px-4 outline-none focus:border-[#7F77DD] transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1">Función</label>
                <input
                  type="text"
                  value={datos.funcion}
                  onChange={(e) => setDatos((d) => ({ ...d, funcion: e.target.value }))}
                  placeholder="Ej: Técnico de Campo"
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm text-sm py-2.5 px-4 outline-none focus:border-[#7F77DD] transition-all"
                />
              </div>
            </div>

            <Select
              label="Motivo de visita"
              options={MOTIVOS_VISITA.map((m) => ({ value: m, label: m }))}
              value={datos.motivo}
              onChange={(e) => setDatos((d) => ({ ...d, motivo: e.target.value as MotivoVisita }))}
              required
            />

            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] block mb-1">
                Patente del vehículo <span className="text-[var(--text-faded)] font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={datos.patente}
                onChange={(e) => setDatos((d) => ({ ...d, patente: e.target.value.toUpperCase() }))}
                placeholder="AA123BB"
                className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm text-sm py-2.5 px-4 outline-none focus:border-[#7F77DD] transition-all font-mono uppercase"
              />
            </div>

            <Button onClick={handleConfirmarDatos} variant="ingreso" size="xl" fullWidth className="mt-2">
              Datos Correctos — Continuar
            </Button>
          </div>
        )}

        {/* PASO 3: Firma */}
        {paso === 'firma' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">{datos.nombre_completo}</span> — firma para confirmar el ingreso
              </p>
            </div>

            <FirmaCanvas
              onFirma={setFirma}
              label="Firma de ingreso"
              height={220}
              required
            />

            <Button
              onClick={handleFirmaCompleta}
              variant="ingreso"
              size="xl"
              fullWidth
              loading={nuevoIngreso.isPending}
              disabled={!firma}
            >
              Confirmar Ingreso
            </Button>
          </div>
        )}

        {/* PASO 4: Éxito */}
        {paso === 'exito' && (
          <div className="flex flex-col items-center justify-center py-10 gap-5 animate-scale-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--btn-salida)' }}>
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium text-[var(--text-primary)]">¡Ingreso registrado!</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{datos.nombre_completo}</p>
            </div>
            <p className="text-sm text-[var(--text-faded)]">Volviendo al inicio...</p>
          </div>
        )}
      </div>
    </TabletLayout>
  )
}
