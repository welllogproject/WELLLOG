// src/views/operador/OperadorHome.tsx
// Vista principal del operador — lista "dentro" + botones principales
// Máximo 2 botones visibles. Diseño mobile-first para tablet.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useEquipo } from '@/hooks/useEquipos'
import { usePersonasDentro } from '@/hooks/useRegistros'
import { TabletLayout } from '@/components/layout/TabletLayout'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { UserCheck, LogIn, Clock, Building2, Briefcase } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/stores/authStore'

function formatTiempo(fechaIngreso: string): string {
  try {
    return formatDistanceToNow(new Date(fechaIngreso), { addSuffix: false, locale: es })
  } catch {
    return '—'
  }
}

export function OperadorHome() {
  const navigate = useNavigate()
  const { equipoId } = useAuthStore()
  const { data: equipo } = useEquipo(equipoId)
  const { data: personas, isLoading } = usePersonasDentro(equipoId)
  const [search, setSearch] = useState('')

  const personasFiltradas = (personas ?? []).filter((p) =>
    search.length === 0 ||
    p.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
    p.dni.includes(search)
  )

  // Pantalla de tablet no configurada
  if (!equipoId) {
    return (
      <TabletLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#BA7517]/10 flex items-center justify-center">
            <span className="text-3xl">⚙️</span>
          </div>
          <h2 className="text-lg font-medium text-[#2C2C2A]">Tablet sin configurar</h2>
          <p className="text-sm text-[#5F5E5A] max-w-xs">
            Esta tablet no tiene un equipo asignado. Contactá al administrador para vincularla.
          </p>
          <div className="mt-2 px-4 py-2 bg-[#F0EFED] rounded-full">
            <p className="text-xs text-[#888780] font-mono">
              ID: {navigator.userAgent.slice(0, 20)}...
            </p>
          </div>
        </div>
      </TabletLayout>
    )
  }

  return (
    <TabletLayout
      equipoNombre={equipo?.nombre_equipo}
      locacionCodigo={equipo?.locacion?.codigo}
    >
      <OfflineBanner />

      {/* Stats rápidos */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.06)] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-medium text-[#2C2C2A]">
              {isLoading ? '—' : personas?.length ?? 0}
            </p>
            <p className="text-sm text-[#5F5E5A]">personas dentro</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#888780]">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-xs text-[#AAAAAA]">
              {equipo?.locacion?.nombre || 'Locación no asignada'}
            </p>
          </div>
        </div>
      </div>

      {/* Botones principales — TOQUE 1 */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <button
          id="btn-nuevo-ingreso"
          onClick={() => navigate('/operador/ingreso')}
          className="flex flex-col items-center gap-2.5 p-5 rounded-clay text-white shadow-clay font-medium transition-all duration-150 active:scale-98"
          style={{ background: 'var(--btn-ingreso)' }}
        >
          <LogIn size={28} />
          <span className="text-base">Nuevo Ingreso</span>
        </button>

        <button
          id="btn-marcar-salida"
          onClick={() => navigate('/operador/salida')}
          disabled={(personas?.length ?? 0) === 0}
          className="flex flex-col items-center gap-2.5 p-5 rounded-clay text-white shadow-clay font-medium transition-all duration-150 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--btn-salida)' }}
        >
          <UserCheck size={28} />
          <span className="text-base">Marcar Salida</span>
        </button>
      </div>

      {/* Lista de personas dentro */}
      <div className="flex-1 flex flex-col px-4 pb-4 gap-3 overflow-hidden">
        {/* Buscador */}
        {(personas?.length ?? 0) > 0 && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o DNI..."
            className="w-full bg-white border border-[rgba(0,0,0,0.1)] rounded-clay-sm text-sm py-2.5 px-4 outline-none focus:border-[#7F77DD] transition-colors"
          />
        )}

        {/* Cards de personas */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : personasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-10 h-10 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
                <UserCheck size={20} className="text-[#1D9E75]" />
              </div>
              <p className="text-sm text-[#5F5E5A]">
                {search ? 'Sin resultados' : 'Nadie dentro del equipo'}
              </p>
            </div>
          ) : (
            personasFiltradas.map((persona) => (
              <div key={persona.id} className="card-clay p-4 flex items-center gap-3">
                {/* Avatar inicial */}
                <div className="w-10 h-10 rounded-full bg-[#7F77DD]/12 flex-shrink-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-[#534AB7]">
                    {persona.nombre_completo.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2C2C2A] truncate">{persona.nombre_completo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#888780]">DNI {persona.dni}</span>
                    {persona.empresa_visitante_nombre && (
                      <>
                        <span className="text-[#DDDDDD]">·</span>
                        <span className="flex items-center gap-1 text-xs text-[#888780]">
                          <Building2 size={10} />
                          {persona.empresa_visitante_nombre}
                        </span>
                      </>
                    )}
                  </div>
                  {persona.funcion_visitante && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-[#AAAAAA]">
                      <Briefcase size={10} />
                      {persona.funcion_visitante}
                    </div>
                  )}
                </div>

                {/* Tiempo */}
                <div className="flex items-center gap-1 text-xs text-[#AAAAAA] flex-shrink-0">
                  <Clock size={12} />
                  {formatTiempo(persona.fecha_ingreso)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </TabletLayout>
  )
}
