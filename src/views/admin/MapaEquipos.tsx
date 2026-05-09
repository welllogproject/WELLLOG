// src/views/admin/MapaEquipos.tsx
// Mapa interactivo con todos los equipos — Leaflet

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEquiposConPersonas } from '@/hooks/useEquipos'
import { useMapStore } from '@/stores/mapStore'
import { parseGeoPoint } from '@/lib/geo'
import { PageLayout } from '@/components/layout/PageLayout'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { StatusDot } from '@/components/ui/StatusDot'
import { Users, X, MapPin } from 'lucide-react'

// Fix Leaflet default icon path issue with Vite
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Crear íconos custom con color por estado
function crearIcono(color: string, count: number) {
  const svg = `
    <svg width="36" height="42" viewBox="0 0 36 42" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="17" fill="${color}" stroke="white" stroke-width="2.5"/>
      <text x="18" y="23" text-anchor="middle" font-family="Inter,sans-serif" font-size="${count >= 10 ? '11' : '13'}" font-weight="600" fill="white">${count}</text>
      <polygon points="18,38 12,28 24,28" fill="${color}"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -44],
  })
}

const ESTADO_COLORES: Record<string, string> = {
  activo: '#1D9E75',
  mantenimiento: '#BA7517',
  inactivo: '#888780',
}

function PanelEquipo() {
  const { equipoSeleccionado, cerrarPanel } = useMapStore()
  if (!equipoSeleccionado) return null

  return (
    <div className="absolute top-4 right-4 z-[1000] w-72 animate-slide-up">
      <Card padding="none">
        <div className="flex items-center justify-between p-4 border-b border-[var(--divider)]">
          <div>
            <p className="font-medium text-[var(--text-primary)]">{equipoSeleccionado.nombre_equipo}</p>
            <p className="text-xs text-[var(--text-muted)]">{equipoSeleccionado.locacion?.codigo || 'Sin locación'}</p>
          </div>
          <button
            onClick={cerrarPanel}
            className="p-1.5 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-muted)]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-secondary)]">Personas dentro</span>
            </div>
            <span className="text-lg font-medium text-[var(--text-primary)]">—</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Estado</span>
            <Badge
              variant={equipoSeleccionado.estado === 'activo' ? 'activo' : equipoSeleccionado.estado === 'mantenimiento' ? 'mantenimiento' : 'inactivo'}
              showDot
            >
              {equipoSeleccionado.estado === 'activo' ? 'Operativo' : equipoSeleccionado.estado === 'mantenimiento' ? 'Mantenimiento' : 'Inactivo'}
            </Badge>
          </div>
          {equipoSeleccionado.operador && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Operador</span>
              <span className="text-sm text-[var(--text-primary)]">{equipoSeleccionado.operador.nombre_completo}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// Componente para ajustar el mapa cuando hay equipos
function MapaAutoZoom({ puntos }: { puntos: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (puntos.length === 0) return
    const bounds = L.latLngBounds(puntos)
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [puntos, map])
  return null
}

export function MapaEquipos() {
  const { data: equipos, isLoading } = useEquiposConPersonas()
  const { seleccionarEquipo } = useMapStore()

  // Resolver coords parseadas una sola vez por equipo
  const equiposConCoords = (equipos ?? [])
    .map((e) => ({ equipo: e, coords: parseGeoPoint(e.ubicacion_punto) }))
    .filter((x): x is { equipo: typeof x.equipo; coords: [number, number] } => x.coords !== null)
  const equiposSinUbicacion = (equipos ?? []).filter((e) => !parseGeoPoint(e.ubicacion_punto))

  // Centro de Argentina como fallback
  const centroArgentina: [number, number] = [-38.4161, -63.6167]

  return (
    <PageLayout
      title="Mapa de Equipos"
      subtitle={`${equiposConCoords.length} equipo${equiposConCoords.length !== 1 ? 's' : ''} con ubicación`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-180px)]">
        {/* Mapa principal */}
        <div className="lg:col-span-3 relative rounded-clay overflow-hidden border border-[var(--border)]">
          <MapContainer
            center={centroArgentina}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {equiposConCoords.map(({ equipo, coords }) => (
              <Marker
                key={equipo.id}
                position={coords}
                icon={crearIcono(
                  ESTADO_COLORES[equipo.estado] || '#888780',
                  equipo.personas_dentro ?? 0
                )}
                eventHandlers={{ click: () => seleccionarEquipo(equipo) }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">{equipo.nombre_equipo}</p>
                    <p className="text-[var(--text-muted)] text-xs">{equipo.locacion?.codigo}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {equiposConCoords.length > 0 && (
              <MapaAutoZoom puntos={equiposConCoords.map((x) => x.coords)} />
            )}
          </MapContainer>

          {/* Panel lateral en el mapa */}
          <PanelEquipo />

          {/* Leyenda */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-clay-sm p-3 shadow-clay-sm">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Estado</p>
            {[
              { color: 'green' as const, label: 'Operativo' },
              { color: 'amber' as const, label: 'Mantenimiento' },
              { color: 'gray' as const, label: 'Inactivo' },
              { color: 'red' as const, label: 'Con incidente' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
                <StatusDot color={item.color} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Lista lateral */}
        <div className="overflow-y-auto space-y-2">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">Todos los equipos</h3>
          {isLoading ? (
            <div className="text-sm text-[var(--text-muted)]">Cargando...</div>
          ) : (
            (equipos ?? []).map((equipo) => (
              <button
                key={equipo.id}
                onClick={() => seleccionarEquipo(equipo)}
                className="w-full card-clay p-3 text-left hover:border-[#7F77DD]/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <StatusDot
                    color={equipo.estado === 'activo' ? 'green' : equipo.estado === 'mantenimiento' ? 'amber' : 'gray'}
                    pulse={equipo.estado === 'activo'}
                  />
                  <p className="text-sm font-medium text-[var(--text-primary)]">{equipo.nombre_equipo}</p>
                </div>
                <p className="text-xs text-[var(--text-muted)] ml-4">
                  {equipo.locacion?.codigo || 'Sin locación'}
                </p>
                {!parseGeoPoint(equipo.ubicacion_punto) && (
                  <p className="text-[10px] text-[#BA7517] mt-1 flex items-center gap-1">
                    <MapPin size={9} /> Sin coordenadas
                  </p>
                )}
              </button>
            ))
          )}

          {equiposSinUbicacion.length > 0 && (
            <p className="text-xs text-[#BA7517] text-center mt-2">
              {equiposSinUbicacion.length} equipo{equiposSinUbicacion.length > 1 ? 's' : ''} sin ubicación configurada
            </p>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
