import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useEquipo, useActualizarEquipo } from '@/hooks/useEquipos'
import { useGPS } from '@/hooks/useGPS'
import { TabletLayout } from '@/components/layout/TabletLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MapPin, Navigation, CheckCircle2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export function ConfigEquipo() {
  const { equipoId } = useAuthStore()
  const { data: equipo } = useEquipo(equipoId)
  const { capturar, position, isCapturing } = useGPS()
  const actualizar = useActualizarEquipo()

  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [guardado, setGuardado] = useState(false)

  async function usarGPS() {
    const resultado = await capturar()
    if (resultado) {
      setLat(resultado.lat.toFixed(6))
      setLng(resultado.lng.toFixed(6))
    } else {
      toast.error('No se pudo obtener la ubicación GPS')
    }
  }

  async function guardar() {
    const latN = parseFloat(lat)
    const lngN = parseFloat(lng)

    if (isNaN(latN) || isNaN(lngN)) {
      toast.error('Coordenadas inválidas')
      return
    }
    if (latN < -55 || latN > -22 || lngN < -73 || lngN > -53) {
      toast.error('Las coordenadas deben estar dentro de Argentina')
      return
    }

    await actualizar.mutateAsync({
      id: equipoId!,
      ubicacion_punto: `POINT(${lngN} ${latN})`,
    })
    setGuardado(true)
    toast.success('Ubicación actualizada')
    setTimeout(() => setGuardado(false), 3000)
  }

  const coordActual = equipo?.ubicacion_punto as any

  return (
    <TabletLayout equipoNombre={equipo?.nombre_equipo} locacionCodigo={equipo?.locacion?.codigo}>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-[12px] bg-[#7F77DD]/10 flex items-center justify-center">
              <MapPin size={20} className="text-[#534AB7]" />
            </div>
            <div>
              <h2 className="text-base font-medium text-[#2C2C2A]">Ubicación del equipo</h2>
              <p className="text-xs text-[#888780]">Solo se puede cambiar desde acá</p>
            </div>
          </div>

          {/* Coordenada actual */}
          {coordActual && (
            <div className="bg-[#1D9E75]/8 border border-[#1D9E75]/20 rounded-[12px] p-4 mb-5">
              <p className="text-xs font-medium text-[#0F6E56] mb-1">Ubicación actual</p>
              <p className="text-xs font-mono text-[#0F6E56]">
                {(coordActual.lat ?? coordActual.coordinates?.[1])?.toFixed(5)},&nbsp;
                {(coordActual.lng ?? coordActual.coordinates?.[0])?.toFixed(5)}
              </p>
            </div>
          )}

          {/* Capturar GPS */}
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={usarGPS}
            loading={isCapturing}
            className="mb-4"
          >
            <Navigation size={16} className="mr-2" />
            Usar ubicación actual (GPS)
          </Button>

          {!position && !isCapturing && lat === '' && (
            <div className="flex items-center gap-2 bg-[#BA7517]/8 rounded-[10px] p-3 mb-4">
              <AlertTriangle size={14} className="text-[#BA7517]" />
              <p className="text-xs text-[#7A4E0F]">GPS no disponible — ingresá las coordenadas manualmente</p>
            </div>
          )}

          {/* Ingresar manual */}
          <div className="flex flex-col gap-3 mb-6">
            <Input
              label="Latitud"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="-38.416100"
              type="number"
              step="0.000001"
            />
            <Input
              label="Longitud"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="-63.598900"
              type="number"
              step="0.000001"
            />
          </div>

          <Button
            variant="ingreso"
            size="lg"
            fullWidth
            onClick={guardar}
            loading={actualizar.isPending}
            disabled={!lat || !lng}
          >
            {guardado
              ? <><CheckCircle2 size={16} className="mr-2" /> Guardado</>
              : <><MapPin size={16} className="mr-2" /> Guardar ubicación</>
            }
          </Button>
        </div>
      </div>
    </TabletLayout>
  )
}
