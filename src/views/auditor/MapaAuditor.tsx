import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { EquiposMap } from '@/components/map/EquiposMap'
import type { Equipo } from '@/types/models'

function useEquiposAuditor() {
  const { usuario } = useAuthStore()
  return useQuery({
    queryKey: ['auditor', 'equipos-mapa', usuario?.empresa_id],
    queryFn: async () => {
      if (!usuario?.empresa_id) return []

      // Obtener equipos autorizados via permisos_acceso
      const today = new Date().toISOString().split('T')[0]
      const { data: permisos } = await supabase
        .from('permisos_acceso')
        .select('equipo_id, puede_ver_coordenadas')
        .eq('empresa_auditora_id', usuario.empresa_id)
        .eq('activo', true)
        .lte('fecha_inicio', today)
        .or(`fecha_fin.is.null,fecha_fin.gte.${today}`)

      const equipoIds = (permisos ?? [])
        .filter((p) => p.equipo_id)
        .map((p) => p.equipo_id as string)

      if (equipoIds.length === 0) return []

      const { data, error } = await supabase
        .from('equipos')
        .select(`
          id, nombre_equipo, tipo_equipo, estado, descripcion,
          ubicacion_punto, locacion_actual_id,
          locacion:locaciones(id, codigo, nombre),
          operador:usuarios!operador_asignado_id(id, nombre_completo, email),
          personas_dentro:registros_acceso(count)
        `)
        .in('id', equipoIds)
        .is('deleted_at', null)
      if (error) throw error

      // personas_dentro: solo registros con estado='dentro'
      const equiposConConteo = await Promise.all(
        (data ?? []).map(async (e: any) => {
          const { count } = await supabase
            .from('registros_acceso')
            .select('*', { count: 'exact', head: true })
            .eq('equipo_id', e.id)
            .eq('estado', 'dentro')
          return { ...e, personas_dentro: count ?? 0 }
        })
      )

      return equiposConConteo as Equipo[]
    },
    enabled: !!usuario?.empresa_id,
    refetchInterval: 30_000,
  })
}

export function MapaAuditor() {
  const { data: equipos = [], isLoading } = useEquiposAuditor()

  return (
    <PageLayout
      title="Mapa de Equipos"
      subtitle="Ubicaciones aproximadas ±500m — actualización cada 30 segundos"
    >
      {isLoading ? (
        <div className="h-[560px] bg-[#F0F0EE] rounded-[16px] animate-pulse" />
      ) : (
        <div style={{ height: 'calc(100vh - 200px)', minHeight: 500 }}>
          <EquiposMap equipos={equipos} degradarCoords linkBase="/auditor" />
        </div>
      )}
    </PageLayout>
  )
}
