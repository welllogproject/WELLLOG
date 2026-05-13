// src/hooks/useDocumentos.ts
// Verificación de documentos de seguridad por DNI

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export interface AlertaDocumento {
  id: string
  tipo: string
  nombre_documento: string | null
  fecha_vencimiento: string | null
  nivel_alerta: 'warning' | 'danger'
  bloqueante: boolean
  dias_vencido: number // negativo = vencido hace X días, positivo = vence en X días
}

/**
 * Verifica documentos de seguridad para un DNI específico.
 * Retorna alertas si hay documentos vencidos o próximos a vencer.
 */
export function useVerificarDocumentos(dni: string) {
  const empresaId = useAuthStore((s) => s.empresaId())

  return useQuery({
    queryKey: ['documentos', 'verificar', dni, empresaId],
    queryFn: async (): Promise<AlertaDocumento[]> => {
      if (!empresaId || !dni || dni.length < 7) return []

      const { data, error } = await supabase
        .from('documentos_seguridad')
        .select('id, tipo, nombre_documento, fecha_vencimiento, nivel_alerta, bloqueante')
        .eq('empresa_id', empresaId)
        .eq('dni_titular', dni)

      if (error) {
        console.warn('[useVerificarDocumentos] Error:', error.message)
        return []
      }

      if (!data || data.length === 0) return []

      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      const alertas: AlertaDocumento[] = []

      for (const doc of data) {
        if (!doc.fecha_vencimiento) continue

        const vencimiento = new Date(doc.fecha_vencimiento)
        vencimiento.setHours(0, 0, 0, 0)
        const diasDiff = Math.ceil((vencimiento.getTime() - hoy.getTime()) / 86400000)

        // Alertar si vencido o vence en menos de 7 días
        if (diasDiff <= 7) {
          alertas.push({
            id: doc.id,
            tipo: doc.tipo,
            nombre_documento: doc.nombre_documento,
            fecha_vencimiento: doc.fecha_vencimiento,
            nivel_alerta: doc.nivel_alerta,
            bloqueante: doc.bloqueante,
            dias_vencido: diasDiff,
          })
        }
      }

      // Ordenar: bloqueantes primero, luego por días (más urgentes primero)
      alertas.sort((a, b) => {
        if (a.bloqueante && !b.bloqueante) return -1
        if (!a.bloqueante && b.bloqueante) return 1
        return a.dias_vencido - b.dias_vencido
      })

      return alertas
    },
    enabled: !!empresaId && !!dni && dni.length >= 7,
    staleTime: 1000 * 60 * 5, // 5 min — no cambia tan seguido
  })
}
