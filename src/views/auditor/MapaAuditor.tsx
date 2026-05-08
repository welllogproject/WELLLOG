import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageLayout } from '@/components/layout/PageLayout'
import { EquiposMap } from '@/components/map/EquiposMap'
import type { Equipo } from '@/types/models'

function useEquiposAuditor() {
  return useQuery({
    queryKey: ['auditor', 'equipos-mapa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipos')
        .select(`
          id, nombre_equipo, tipo_equipo, estado, descripcion,
          ubicacion_punto, locacion_actual_id,
          locacion:locaciones(id, codigo, nombre),
          operador:usuarios!operador_asignado_id(id, nombre_completo, email),
          personas_dentro:registros_acceso(count)
        `)
        .is('deleted_at', null)
      if (error) throw error
      return (data ?? []).map((e: any) => ({
        ...e,
        personas_dentro: e.personas_dentro?.[0]?.count ?? 0,
      })) as Equipo[]
    },
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
