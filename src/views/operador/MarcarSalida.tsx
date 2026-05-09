// src/views/operador/MarcarSalida.tsx
// Flujo de egreso: Buscar → Seleccionar → Declaración → [Incidente] → Éxito
// Filosofía 4x4: mínimo toques, máxima robustez, funciona offline

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { usePersonasDentro, useMarcarEgreso } from '@/hooks/useRegistros'
import { useCrearIncidente } from '@/hooks/useIncidentes'
import { useEquipo } from '@/hooks/useEquipos'
import { TabletLayout } from '@/components/layout/TabletLayout'
import { DeclaracionIncidente, type DeclaracionResult } from '@/components/registro/DeclaracionIncidente'
import { FormIncidente } from '@/components/registro/FormIncidente'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { ArrowLeft, CheckCircle2, Clock, Building2, Hash, List } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { RegistroAcceso, FormIncidenteData } from '@/types/models'

type Paso = 'lista' | 'declaracion' | 'incidente' | 'exito'
type ModoLista = 'visual' | 'dni'

function tiempoDesde(fecha: string) {
  try {
    return formatDistanceToNow(new Date(fecha), { addSuffix: false, locale: es })
  } catch { return '—' }
}

// Numpad compacto para buscar por DNI en egreso
const NUMPAD = ['1','2','3','4','5','6','7','8','9','←','0','✓']

function NumpadDNI({
  value,
  onChange,
  onConfirm,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  disabled?: boolean
}) {
  const handleKey = (key: string) => {
    if (key === '←') { onChange(value.slice(0, -1)); return }
    if (key === '✓') { if (value.length >= 7) onConfirm(); return }
    if (value.length < 9) onChange(value + key)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Display DNI */}
      <div className={[
        'w-full text-center text-4xl font-medium tracking-[0.2em] py-5 px-4',
        'bg-[var(--card-bg)] border-2 rounded-clay transition-colors',
        value.length >= 7 ? 'border-[#1D9E75]' : 'border-[var(--border-strong)]',
        'text-[var(--text-primary)]',
      ].join(' ')}>
        {value || <span className="text-[var(--text-faded)] text-3xl">DNI</span>}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs">
        {NUMPAD.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleKey(key)}
            disabled={disabled || (key === '✓' && value.length < 7)}
            className={[
              'h-14 rounded-clay text-xl font-medium transition-all duration-100 select-none active:scale-95',
              key === '✓'
                ? value.length >= 7
                  ? 'btn-salida text-white shadow-clay-sm'
                  : 'bg-[#888780]/10 text-[var(--text-faded)] cursor-not-allowed'
                : key === '←'
                ? 'bg-[var(--card-bg)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                : 'bg-[var(--card-bg)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] shadow-clay-sm',
            ].join(' ')}
            aria-label={key === '←' ? 'Borrar' : key === '✓' ? 'Buscar' : key}
          >
            {key === '←' ? '⌫' : key}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        {value.length < 7 ? 'Ingresá el DNI de quien sale' : `Buscando DNI ${value}...`}
      </p>
    </div>
  )
}

export function MarcarSalida() {
  const navigate = useNavigate()
  const { equipoId } = useAuthStore()
  const { data: equipo } = useEquipo(equipoId)
  const { data: personas, isLoading } = usePersonasDentro(equipoId)
  const marcarEgreso = useMarcarEgreso()
  const crearIncidente = useCrearIncidente()

  const [paso, setPaso] = useState<Paso>('lista')
  const [modo, setModo] = useState<ModoLista>('visual')
  const [search, setSearch] = useState('')
  const [dniBusqueda, setDniBusqueda] = useState('')
  const [personaSeleccionada, setPersonaSeleccionada] = useState<RegistroAcceso | null>(null)
  const [declaracion, setDeclaracion] = useState<DeclaracionResult | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Foco automático en el buscador al entrar en modo visual
  useEffect(() => {
    if (paso === 'lista' && modo === 'visual') {
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [paso, modo])

  // Filtrar por texto libre (modo visual)
  const personasFiltradas = (personas ?? []).filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.nombre_completo.toLowerCase().includes(q) || p.dni.includes(search)
  })

  // Filtrar por DNI exacto (modo numpad)
  const personasPorDNI = dniBusqueda.length >= 7
    ? (personas ?? []).filter((p) => p.dni === dniBusqueda || p.dni.startsWith(dniBusqueda))
    : []

  const seleccionarPersona = (persona: RegistroAcceso) => {
    setPersonaSeleccionada(persona)
    setPaso('declaracion')
  }

  const handleBuscarDNI = () => {
    if (personasPorDNI.length === 1) {
      // Match exacto → seleccionar directo sin mostrar lista
      seleccionarPersona(personasPorDNI[0])
    }
    // Si hay varios resultados, se muestran abajo del numpad
  }

  const handleDeclaracion = async (result: DeclaracionResult) => {
    setDeclaracion(result)
    if (result.declara) {
      setPaso('incidente')
    } else {
      await marcarEgreso.mutateAsync({
        registro_id: personaSeleccionada!.id,
        declara_incidente: false,
        firma_declaracion_data: result.firma,
      })
      setPaso('exito')
      setTimeout(() => navigate('/operador'), 2000)
    }
  }

  const handleIncidente = async (form: FormIncidenteData) => {
    await marcarEgreso.mutateAsync({
      registro_id: personaSeleccionada!.id,
      declara_incidente: true,
      firma_declaracion_data: declaracion!.firma,
    })
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

  const volverAtras = () => {
    if (paso === 'lista') navigate('/operador')
    else if (paso === 'declaracion') { setPaso('lista'); setPersonaSeleccionada(null) }
    else if (paso === 'incidente') setPaso('declaracion')
  }

  return (
    <TabletLayout equipoNombre={equipo?.nombre_equipo} locacionCodigo={equipo?.locacion?.codigo}>
      {/* Header */}
      <div className="bg-[var(--card-bg)] border-b border-[var(--divider)] px-5 py-3 flex items-center gap-3">
        {paso !== 'exito' && (
          <button
            onClick={volverAtras}
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

        {/* Toggle modo búsqueda — solo en paso lista */}
        {paso === 'lista' && (personas?.length ?? 0) > 0 && (
          <div className="ml-auto flex items-center bg-[var(--input-bg)] rounded-[10px] p-1 gap-1">
            <button
              onClick={() => { setModo('visual'); setDniBusqueda('') }}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all',
                modo === 'visual'
                  ? 'bg-[var(--card-bg)] text-[#534AB7] shadow-clay-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
              title="Ver lista"
            >
              <List size={14} /> Lista
            </button>
            <button
              onClick={() => { setModo('dni'); setSearch('') }}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all',
                modo === 'dni'
                  ? 'bg-[var(--card-bg)] text-[#534AB7] shadow-clay-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
              title="Buscar por DNI"
            >
              <Hash size={14} /> DNI
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5">

        {/* ── PASO 1: Lista / Búsqueda ── */}
        {paso === 'lista' && (
          <div className="animate-fade-in">

            {/* MODO VISUAL: lista con buscador de texto */}
            {modo === 'visual' && (
              <div className="flex flex-col gap-4">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o DNI..."
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm text-sm py-3 px-4 outline-none focus:border-[#7F77DD] transition-colors"
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
                      <PersonaCard
                        key={persona.id}
                        persona={persona}
                        onClick={() => seleccionarPersona(persona)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* MODO DNI: numpad grande */}
            {modo === 'dni' && (
              <div className="flex flex-col gap-5">
                <NumpadDNI
                  value={dniBusqueda}
                  onChange={setDniBusqueda}
                  onConfirm={handleBuscarDNI}
                  disabled={marcarEgreso.isPending}
                />

                {/* Resultados del DNI */}
                {dniBusqueda.length >= 7 && (
                  <div className="space-y-2 animate-fade-in">
                    {personasPorDNI.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-[var(--text-muted)]">DNI {dniBusqueda} no está dentro</p>
                        <p className="text-xs text-[var(--text-faded)] mt-1">Verificá el número o usá la lista</p>
                      </div>
                    ) : (
                      personasPorDNI.map((persona) => (
                        <PersonaCard
                          key={persona.id}
                          persona={persona}
                          onClick={() => seleccionarPersona(persona)}
                          highlight
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PASO 2: Declaración ── */}
        {paso === 'declaracion' && personaSeleccionada && (
          <DeclaracionIncidente
            registro={{
              nombre_completo: personaSeleccionada.nombre_completo,
              dni: personaSeleccionada.dni,
              empresa: personaSeleccionada.empresa_visitante_nombre,
              funcion: personaSeleccionada.funcion_visitante,
              motivo: personaSeleccionada.motivo_visita,
              fecha_ingreso: personaSeleccionada.fecha_ingreso,
              equipo: equipo?.nombre_equipo,
              locacion: equipo?.locacion?.codigo,
            }}
            onConfirm={handleDeclaracion}
            isLoading={marcarEgreso.isPending}
          />
        )}

        {/* ── PASO 3: Formulario incidente ── */}
        {paso === 'incidente' && (
          <FormIncidente
            onSubmit={handleIncidente}
            isLoading={crearIncidente.isPending || marcarEgreso.isPending}
          />
        )}

        {/* ── PASO 4: Éxito ── */}
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

// Componente reutilizable para la card de persona
function PersonaCard({
  persona,
  onClick,
  highlight = false,
}: {
  persona: RegistroAcceso
  onClick: () => void
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full card-clay p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99]',
        highlight
          ? 'border-[#1D9E75] hover:border-[#1D9E75]'
          : 'hover:border-[#7F77DD]/30',
      ].join(' ')}
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
  )
}
