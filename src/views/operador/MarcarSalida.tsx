// src/views/operador/MarcarSalida.tsx
// Flujo de egreso: Lista → Seleccionar → Declaración → [Incidente] → Éxito
// Máximo 3 toques en el caso feliz (sin incidente)

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { usePersonasDentro, useMarcarEgreso } from '@/hooks/useRegistros'
import { useCrearIncidente } from '@/hooks/useIncidentes'
import { useEquipo } from '@/hooks/useEquipos'
import { TabletLayout } from '@/components/layout/TabletLayout'
import { DeclaracionIncidente, type DeclaracionResult } from '@/components/registro/DeclaracionIncidente'
import { FormIncidente } from '@/components/registro/FormIncidente'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { ArrowLeft, CheckCircle2, Clock, Building2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { RegistroAcceso, FormIncidenteData } from '@/types/models'

type Paso = 'lista' | 'declaracion' | 'incidente' | 'exito'

function tiempoDesde(fecha: string) {
  try {
    return formatDistanceToNow(new Date(fecha), { addSuffix: false, locale: es })
  } catch { return '—' }
}

export function MarcarSalida() {
  const navigate = useNavigate()
  const { equipoId } = useAuthStore()
  const { data: equipo } = useEquipo(equipoId)
  const { data: personas, isLoading } = usePersonasDentro(equipoId)
  const marcarEgreso = useMarcarEgreso()
  const crearIncidente = useCrearIncidente()

  const [paso, setPaso] = useState<Paso>('lista')
  const [search, setSearch] = useState('')
  const [personaSeleccionada, setPersonaSeleccionada] = useState<RegistroAcceso | null>(null)
  const [declaracion, setDeclaracion] = useState<DeclaracionResult | null>(null)

  const personasFiltradas = (personas ?? []).filter((p) =>
    !search || p.nombre_completo.toLowerCase().includes(search.toLowerCase()) || p.dni.includes(search)
  )

  const seleccionarPersona = (persona: RegistroAcceso) => {
    setPersonaSeleccionada(persona)
    setPaso('declaracion')
  }

  const handleDeclaracion = async (result: DeclaracionResult) => {
    setDeclaracion(result)

    if (result.declara) {
      // Ir al formulario de incidente
      setPaso('incidente')
    } else {
      // Caso feliz: cerrar egreso directamente
      await marcarEgreso.mutateAsync({
        registro_id: personaSeleccionada!.id,
        declara_incidente: false,
        firma_declaracion_data: result.firma,
      })
      setPaso('exito')
    }
  }

  const handleIncidente = async (form: FormIncidenteData) => {
    // 1. Cerrar el egreso
    await marcarEgreso.mutateAsync({
      registro_id: personaSeleccionada!.id,
      declara_incidente: true,
      firma_declaracion_data: declaracion!.firma,
    })

    // 2. Crear el incidente
    await crearIncidente.mutateAsync({
      registroId: personaSeleccionada!.id,
      form,
      locacionId: personaSeleccionada!.locacion_id,
      nombreAfectado: personaSeleccionada!.nombre_completo,
      dniAfectado: personaSeleccionada!.dni,
      empresaAfectado: personaSeleccionada!.empresa_visitante_nombre,
      funcionAfectado: personaSeleccionada!.funcion_visitante,
    })

    setPaso('exito')
    setTimeout(() => navigate('/operador'), 3000)
  }

  return (
    <TabletLayout equipoNombre={equipo?.nombre_equipo} locacionCodigo={equipo?.locacion?.codigo}>
      {/* Header */}
      <div className="bg-[var(--card-bg)] border-b border-[var(--divider)] px-5 py-3 flex items-center gap-3">
        {paso !== 'exito' && (
          <button
            onClick={() => {
              if (paso === 'lista') navigate('/operador')
              else if (paso === 'declaracion') { setPaso('lista'); setPersonaSeleccionada(null) }
              else if (paso === 'incidente') setPaso('declaracion')
            }}
            className="p-1.5 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h2 className="text-base font-medium text-[var(--text-primary)]">
          {paso === 'lista' ? 'Marcar Salida' :
           paso === 'declaracion' ? 'Declaración de Incidente' :
           paso === 'incidente' ? 'Detalle del Incidente' :
           'Egreso Registrado'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* PASO 1: Lista de personas dentro */}
        {paso === 'lista' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o DNI..."
              className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm text-sm py-2.5 px-4 outline-none focus:border-[#7F77DD] transition-colors"
              autoFocus
            />

            <div className="space-y-2">
              {isLoading ? (
                <><SkeletonRow /><SkeletonRow /></>
              ) : personasFiltradas.length === 0 ? (
                <p className="text-center text-sm text-[var(--text-muted)] py-8">
                  {search ? 'Sin resultados' : 'Nadie dentro del equipo'}
                </p>
              ) : (
                personasFiltradas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => seleccionarPersona(persona)}
                    className="w-full card-clay p-4 flex items-center gap-3 text-left hover:border-[#7F77DD]/30 transition-colors active:scale-[0.99]"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#7F77DD]/12 flex-shrink-0 flex items-center justify-center">
                      <span className="text-sm font-medium text-[#534AB7]">
                        {persona.nombre_completo.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{persona.nombre_completo}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--text-muted)]">DNI {persona.dni}</span>
                        {persona.empresa_visitante_nombre && (
                          <>
                            <span className="text-[#DDDDDD]">·</span>
                            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                              <Building2 size={10} />
                              {persona.empresa_visitante_nombre}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--text-faded)] flex-shrink-0">
                      <Clock size={12} />
                      {tiempoDesde(persona.fecha_ingreso)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* PASO 2: Declaración de incidente */}
        {paso === 'declaracion' && personaSeleccionada && (
          <DeclaracionIncidente
            personaNombre={personaSeleccionada.nombre_completo}
            onConfirm={handleDeclaracion}
            isLoading={marcarEgreso.isPending}
          />
        )}

        {/* PASO 3: Formulario de incidente */}
        {paso === 'incidente' && (
          <FormIncidente
            onSubmit={handleIncidente}
            isLoading={crearIncidente.isPending || marcarEgreso.isPending}
          />
        )}

        {/* PASO 4: Éxito */}
        {paso === 'exito' && (
          <div className="flex flex-col items-center justify-center py-10 gap-5 animate-scale-in">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: declaracion?.declara ? 'var(--btn-peligro)' : 'var(--btn-salida)' }}
            >
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium text-[var(--text-primary)]">
                {declaracion?.declara ? 'Egreso con incidente registrado' : '¡Egreso registrado!'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{personaSeleccionada?.nombre_completo}</p>
              {declaracion?.declara && (
                <p className="text-xs text-[#BA7517] mt-2">⚠️ El administrador fue notificado</p>
              )}
            </div>
            <p className="text-sm text-[var(--text-faded)]">Volviendo al inicio...</p>
          </div>
        )}
      </div>
    </TabletLayout>
  )
}
