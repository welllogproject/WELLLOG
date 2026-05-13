// src/views/admin/MapaEquipos.tsx
// Mapa interactivo con todos los equipos — Leaflet

import { useEffect, useRef } from 'react'
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
import { Users, X, MapPin, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

// Fix Leaflet default icon path issue with Vite
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/icons/marker-icon-2x.png',
  iconUrl: '/icons/marker-icon.png',
  shadowUrl: '/icons/marker-shadow.png',
})

// Crear íconos custom con color por estado
function crearIcono(color: string, count: number, selected = false) {
  const size = selected ? 44 : 36
  const r = size / 2 - 2
  const svg = `
    <svg width="${size}" height="${size + 6}" viewBox="0 0 ${size} ${size + 6}" xmlns="http://www.w3.org/2000/svg">
      ${selected ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r + 2}" fill="none" stroke="white" stroke-width="3"/>` : ''}
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${color}" stroke="white" stroke-width="2.5"/>
      <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle" font-family="Inter,sans-serif" font-size="${count >= 10 ? '11' : '13'}" font-weight="600" fill="white">${count}</text>
      <polygon points="${size / 2},${size + 4} ${size / 2 - 6},${size - 4} ${size / 2 + 6},${size - 4}" fill="${color}"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 6],
    popupAnchor: [0, -(size + 8)],
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
            <span className="text-lg font-medium text-[var(--text-primary)]">
              {equipoSeleccionado.personas_dentro ?? 0}
            </span>
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
        {/* Link para ir al equipo */}
        <div className="px-4 pb-4">
          <Link
            to="/admin/equipos"
            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-clay bg-[#7F77DD]/10 text-[#534AB7] hover:bg-[#7F77DD]/20 transition-colors"
          >
            <ExternalLink size={14} />
            Ver equipo completo
          </Link>
        </div>
      </Card>
    </div>
  )
}

// Componente para ajustar el mapa cuando hay equipos
function MapaAutoZoom({ puntos }: { puntos: [number, number][] }) {
  const map = useMap()
  const prevPuntosRef = useRef<string>('')

  useEffect(() => {
    if (puntos.length === 0) return
    const key = puntos.map((p) => `${p[0]},${p[1]}`).join('|')
    if (key === prevPuntosRef.current) return
    prevPuntosRef.current = key
    const bounds = L.latLngBounds(puntos)
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [puntos, map])
  return null
}

// Componente para centrar el mapa en un equipo seleccionado desde el panel lateral
function CentrarEnSeleccionado({ coords }: { coords: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (!coords) return
    map.setView(coords, Math.max(map.getZoom(), 10), { animate: true })
  }, [coords, map])
  return null
}

export function MapaEquipos() {
  const { data: equipos, isLoading } = useEquiposConPersonas()
  const { seleccionarEquipo, equipoSeleccionado } = useMapStore()

  // Resolver coords parseadas una sola vez por equipo
  const equiposConCoords = (equipos ?? [])
    .map((e) => ({ equipo: e, coords: parseGeoPoint(e.ubicacion_punto) }))
    .filter((x): x is { equipo: typeof x.equipo; coords: [number, number] } => x.coords !== null)
  const equiposSinUbicacion = (equipos ?? []).filter((e) => !parseGeoPoint(e.ubicacion_punto))

  // Coords del equipo seleccionado (para centrar el mapa)
  const coordsSeleccionado = equipoSeleccionado
    ? parseGeoPoint(equipoSeleccionado.ubicacion_punto)
    : null

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

            {equiposConCoords.map(({ equipo, coords }) => {
              const isSelected = equipoSeleccionado?.id === equipo.id
              return (
                <Marker
                  key={equipo.id}
                  position={coords}
                  icon={crearIcono(
                    ESTADO_COLORES[equipo.estado] || '#888780',
                    equipo.personas_dentro ?? 0,
                    isSelected
                  )}
                  eventHandlers={{ click: () => seleccionarEquipo(equipo) }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{equipo.nombre_equipo}</p>
                      <p className="text-gray-500 text-xs">{equipo.locacion?.codigo}</p>
                      <p className="text-xs mt-1">{equipo.personas_dentro ?? 0} persona{(equipo.personas_dentro ?? 0) !== 1 ? 's' : ''} dentro</p>
                    </div>
                  </Popup>
                </Marker>
              )
            })}

            {equiposConCoords.length > 0 && (
              <MapaAutoZoom puntos={equiposConCoords.map((x) => x.coords)} />
            )}

            {/* Centrar en equipo seleccionado desde panel lateral */}
            <CentrarEnSeleccionado coords={coordsSeleccionado} />
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
            (equipos ?? []).map((equipo) => {
              const isSelected = equipoSeleccionado?.id === equipo.id
              return (
                <button
                  key={equipo.id}
                  onClick={() => seleccionarEquipo(equipo)}
                  className={[
                    'w-full card-clay p-3 text-left transition-colors',
                    isSelected ? 'border-[#7F77DD] bg-[#7F77DD]/5 ring-1 ring-[#7F77DD]/20' : 'hover:border-[#7F77DD]/30',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <StatusDot
                      color={equipo.estado === 'activo' ? 'green' : equipo.estado === 'mantenimiento' ? 'amber' : 'gray'}
                      pulse={equipo.estado === 'activo'}
                    />
                    <p className="text-sm font-medium text-[var(--text-primary)]">{equipo.nombre_equipo}</p>
                    {(equipo.personas_dentro ?? 0) > 0 && (
                      <span className="ml-auto text-xs font-medium text-[#1D9E75] bg-[#1D9E75]/10 px-1.5 py-0.5 rounded-full">
                        {equipo.personas_dentro}
                      </span>
                    )}
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
              )
            })
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
