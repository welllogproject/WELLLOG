// src/views/superadmin/MapaDispositivos.tsx
// Mapa en vivo con la ubicación de todas las tablets/operadores activos

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Smartphone, Users, Wifi, WifiOff, Clock } from 'lucide-react'
import { useEffect } from 'react'

// Fix Leaflet icons
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/icons/marker-icon-2x.png',
  iconUrl: '/icons/marker-icon.png',
  shadowUrl: '/icons/marker-shadow.png',
})

interface DispositivoGeo {
  id: string
  usuario_id: string
  equipo_id: string | null
  ultima_actividad: string
  online: boolean
  latitud: number | null
  longitud: number | null
  precision_metros: number | null
  user_agent: string | null
  usuario?: { nombre_completo: string; email: string; rol: string } | null
  equipo?: { nombre_equipo: string } | null
}

function useDispositivosGeo() {
  return useQuery({
    queryKey: ['superadmin', 'dispositivos-geo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dispositivos_estado')
        .select(`
          *,
          usuario:usuarios(nombre_completo, email, rol),
          equipo:equipos(nombre_equipo)
        `)
        .not('latitud', 'is', null)
        .not('longitud', 'is', null)
        .order('ultima_actividad', { ascending: false })
      if (error) throw error
      return (data ?? []) as DispositivoGeo[]
    },
    refetchInterval: 15_000, // Cada 15 segundos
  })
}

function crearIconoDispositivo(activo: boolean, online: boolean) {
  const color = activo && online ? '#1D9E75' : activo ? '#BA7517' : '#888780'
  const svg = `
    <svg width="32" height="38" viewBox="0 0 32 38" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2.5"/>
      <rect x="11" y="9" width="10" height="14" rx="2" fill="white" opacity="0.9"/>
      <rect x="13" y="24" width="6" height="1" rx="0.5" fill="white" opacity="0.7"/>
      <polygon points="16,36 11,27 21,27" fill="${color}"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -40],
  })
}

function AutoZoom({ puntos }: { puntos: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (puntos.length === 0) return
    if (puntos.length === 1) {
      map.setView(puntos[0], 12)
      return
    }
    const bounds = L.latLngBounds(puntos)
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [puntos.length]) // eslint-disable-line
  return null
}

function formatTiempo(fecha: string): string {
  const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)
  if (diff < 1) return 'Ahora'
  if (diff < 60) return `Hace ${diff}min`
  if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`
  return `Hace ${Math.floor(diff / 1440)}d`
}

export function MapaDispositivos() {
  const { data: dispositivos = [], isLoading } = useDispositivosGeo()

  const conGeo = dispositivos.filter((d) => d.latitud && d.longitud)
  const activos = conGeo.filter((d) => {
    const diff = Date.now() - new Date(d.ultima_actividad).getTime()
    return diff < 5 * 60_000 // < 5 min
  })
  const online = conGeo.filter((d) => d.online)

  const centroArgentina: [number, number] = [-38.4161, -63.6167]
  const puntos: [number, number][] = conGeo.map((d) => [d.latitud!, d.longitud!])

  return (
    <PageLayout title="Mapa de Dispositivos" subtitle="Ubicación en vivo de tablets y operadores">
      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card-clay p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#7F77DD]/10 flex items-center justify-center">
            <Smartphone size={16} className="text-[#534AB7]" />
          </div>
          <div>
            <p className="text-xl font-medium text-[var(--text-primary)]">{conGeo.length}</p>
            <p className="text-xs text-[var(--text-muted)]">Con ubicación</p>
          </div>
        </div>
        <div className="card-clay p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#1D9E75]/10 flex items-center justify-center">
            <Users size={16} className="text-[#1D9E75]" />
          </div>
          <div>
            <p className="text-xl font-medium text-[var(--text-primary)]">{activos.length}</p>
            <p className="text-xs text-[var(--text-muted)]">Activos ahora</p>
          </div>
        </div>
        <div className="card-clay p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#1D9E75]/10 flex items-center justify-center">
            <Wifi size={16} className="text-[#1D9E75]" />
          </div>
          <div>
            <p className="text-xl font-medium text-[var(--text-primary)]">{online.length}</p>
            <p className="text-xs text-[var(--text-muted)]">Online</p>
          </div>
        </div>
        <div className="card-clay p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#BA7517]/10 flex items-center justify-center">
            <WifiOff size={16} className="text-[#BA7517]" />
          </div>
          <div>
            <p className="text-xl font-medium text-[var(--text-primary)]">{conGeo.length - online.length}</p>
            <p className="text-xs text-[var(--text-muted)]">Offline</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-280px)]">
        {/* Mapa */}
        <div className="lg:col-span-3 rounded-clay overflow-hidden border border-[var(--border)]">
          {isLoading ? (
            <div className="h-full bg-[var(--skeleton)] animate-pulse flex items-center justify-center">
              <p className="text-sm text-[var(--text-muted)]">Cargando mapa...</p>
            </div>
          ) : (
            <MapContainer center={centroArgentina} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {conGeo.map((d) => {
                const diffMin = Math.floor((Date.now() - new Date(d.ultima_actividad).getTime()) / 60000)
                const esActivo = diffMin < 5
                return (
                  <Marker
                    key={d.id}
                    position={[d.latitud!, d.longitud!]}
                    icon={crearIconoDispositivo(esActivo, d.online)}
                  >
                    <Popup>
                      <div className="text-sm min-w-[180px]">
                        <p className="font-medium">{d.usuario?.nombre_completo ?? '—'}</p>
                        <p className="text-xs text-gray-500">{d.usuario?.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {d.equipo?.nombre_equipo ?? 'Sin equipo'} · {d.usuario?.rol}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span className={d.online ? 'text-green-600' : 'text-amber-600'}>
                            {d.online ? '● Online' : '● Offline'}
                          </span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">{formatTiempo(d.ultima_actividad)}</span>
                        </div>
                        {d.precision_metros && (
                          <p className="text-[10px] text-gray-400 mt-1">Precisión: ±{d.precision_metros}m</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
              {puntos.length > 0 && <AutoZoom puntos={puntos} />}
            </MapContainer>
          )}
        </div>

        {/* Lista lateral */}
        <div className="overflow-y-auto space-y-2">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Clock size={11} />
            Última actividad
          </h3>
          {conGeo.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] text-center py-6">
              Sin dispositivos con ubicación
            </p>
          ) : (
            conGeo.map((d) => {
              const diffMin = Math.floor((Date.now() - new Date(d.ultima_actividad).getTime()) / 60000)
              const esActivo = diffMin < 5
              return (
                <Card key={d.id} padding="sm" className="!p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-[#7F77DD]/10 flex items-center justify-center">
                        <Smartphone size={12} className="text-[#534AB7]" />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${esActivo && d.online ? 'bg-[#1D9E75]' : esActivo ? 'bg-[#BA7517]' : 'bg-[#888780]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {d.usuario?.nombre_completo ?? '—'}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        {d.equipo?.nombre_equipo ?? 'Sin equipo'}
                      </p>
                    </div>
                    <Badge variant={esActivo ? 'activo' : 'inactivo'} size="sm">
                      {formatTiempo(d.ultima_actividad)}
                    </Badge>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </PageLayout>
  )
}
