import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Equipo } from '@/types/models'
import { Badge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'
import { parseGeoPoint, offsetCoords } from '@/lib/geo'

// Fix Leaflet default icons with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Pin coloreado con conteo de personas
function createPin(color: string, count: number, hasIncidente: boolean): L.DivIcon {
  const ring = hasIncidente ? `box-shadow:0 0 0 3px ${color}40;` : ''
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
    html: `
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:${color};border:2.5px solid white;
        display:flex;align-items:center;justify-content:center;
        font-size:12px;font-weight:600;color:white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);${ring}
        cursor:pointer;
      ">${count}</div>
    `,
  })
}

const ESTADO_COLOR: Record<string, string> = {
  activo:        '#1D9E75',
  mantenimiento: '#BA7517',
  inactivo:      '#888780',
  incidente:     '#E24B4A',
}

// Componente para centrar el mapa cuando cambian los equipos
function AutoCenter({ puntos }: { puntos: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (puntos.length === 0) return
    if (puntos.length === 1) {
      map.setView(puntos[0], 11)
      return
    }
    const lats = puntos.map((p) => p[0])
    const lngs = puntos.map((p) => p[1])
    map.fitBounds([
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ], { padding: [40, 40] })
  }, [puntos.length, map])
  return null
}

interface Props {
  equipos: Equipo[]
  degradarCoords?: boolean   // true para auditores: offset ±500m
  linkBase?: string          // '/admin' | '/auditor'
}

function getLatLng(punto: unknown, degradar: boolean): [number, number] | null {
  const parsed = parseGeoPoint(punto)
  if (!parsed) return null
  return degradar ? offsetCoords(parsed[0], parsed[1]) : parsed
}

const ESTADO_LABELS: Record<string, string> = {
  activo: 'Operativo', mantenimiento: 'En mantenimiento', inactivo: 'Inactivo',
}

export function EquiposMap({ equipos, degradarCoords = false, linkBase = '/admin' }: Props) {
  const conCoords = equipos.filter((e) => parseGeoPoint(e.ubicacion_punto))
  const sinCoords = equipos.filter((e) => !parseGeoPoint(e.ubicacion_punto))
  const puntosBase = conCoords
    .map((e) => parseGeoPoint(e.ubicacion_punto))
    .filter((p): p is [number, number] => p !== null)

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-1 rounded-[16px] overflow-hidden border border-[var(--border)] min-h-[420px]">
        <MapContainer
          center={[-38.4161, -63.5989]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AutoCenter puntos={puntosBase} />

          {conCoords.map((equipo) => {
            const coords = getLatLng(equipo.ubicacion_punto, degradarCoords)
            if (!coords) return null
            const hasIncidente = !!equipo.tiene_incidente_pendiente
            const colorKey = hasIncidente ? 'incidente' : equipo.estado
            const color = ESTADO_COLOR[colorKey] ?? ESTADO_COLOR.activo
            const count = equipo.personas_dentro ?? 0

            return (
              <Marker
                key={equipo.id}
                position={coords}
                icon={createPin(color, count, hasIncidente)}
              >
                <Popup minWidth={220} maxWidth={280}>
                  <div className="p-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-[var(--text-primary)] text-sm">{equipo.nombre_equipo}</p>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                        style={{ background: color }}
                      >
                        {ESTADO_LABELS[equipo.estado]}
                      </span>
                    </div>
                    {equipo.locacion && (
                      <p className="text-xs text-[var(--text-secondary)] mb-1">
                        📍 {equipo.locacion.codigo}{equipo.locacion.nombre ? ` — ${equipo.locacion.nombre}` : ''}
                      </p>
                    )}
                    <p className="text-xs text-[var(--text-secondary)] mb-2">
                      👥 <strong>{count}</strong> persona{count !== 1 ? 's' : ''} dentro
                    </p>
                    {hasIncidente && (
                      <p className="text-xs text-[#E24B4A] font-medium mb-2">⚠️ Incidente pendiente</p>
                    )}
                    {degradarCoords && (
                      <p className="text-[10px] text-[var(--text-muted)] italic">Coordenadas aproximadas ±500m</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        {[
          { color: ESTADO_COLOR.activo, label: 'Operativo' },
          { color: ESTADO_COLOR.mantenimiento, label: 'Mantenimiento' },
          { color: ESTADO_COLOR.inactivo, label: 'Inactivo' },
          { color: ESTADO_COLOR.incidente, label: 'Incidente pendiente' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
            {label}
          </div>
        ))}
        <span className="text-xs text-[var(--text-muted)] ml-auto">Número = personas dentro</span>
      </div>

      {/* Equipos sin coordenadas */}
      {sinCoords.length > 0 && (
        <div className="card-clay p-4">
          <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">
            {sinCoords.length} equipo{sinCoords.length > 1 ? 's' : ''} sin coordenadas configuradas
          </p>
          <div className="flex flex-wrap gap-2">
            {sinCoords.map((e) => (
              <Badge key={e.id} variant="neutral" size="sm">{e.nombre_equipo}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
