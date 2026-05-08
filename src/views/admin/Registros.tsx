// src/views/admin/Registros.tsx
// Tabla completa de registros con búsqueda y filtros

import { useState } from 'react'
import { useEquipos } from '@/hooks/useEquipos'
import { useRegistrosAdmin } from '@/hooks/useRegistros'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { Search, Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import * as XLSX from 'xlsx'

export function Registros() {
  const [equipoId, setEquipoId] = useState('')
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')

  const { data: equipos } = useEquipos()
  const { data: registros, isLoading } = useRegistrosAdmin(
    equipoId || undefined,
    fechaDesde ? `${fechaDesde}T00:00:00` : undefined,
    fechaHasta ? `${fechaHasta}T23:59:59` : undefined
  )

  const registrosFiltrados = (registros ?? []).filter((r) =>
    !search ||
    r.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
    r.dni.includes(search) ||
    (r.empresa_visitante_nombre || '').toLowerCase().includes(search.toLowerCase())
  )

  const exportarExcel = () => {
    const data = registrosFiltrados.map((r) => ({
      'Fecha Ingreso': r.fecha_ingreso ? new Date(r.fecha_ingreso).toLocaleString('es-AR') : '',
      'Fecha Egreso': r.fecha_egreso ? new Date(r.fecha_egreso).toLocaleString('es-AR') : 'Aún dentro',
      'DNI': r.dni,
      'Nombre': r.nombre_completo,
      'Empresa': r.empresa_visitante_nombre || '',
      'Función': r.funcion_visitante || '',
      'Motivo': r.motivo_visita,
      'Estado': r.estado,
      'Incidente': r.declara_incidente == null ? '—' : r.declara_incidente ? 'SÍ' : 'NO',
      'Patente': r.vehiculo_patente || '',
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'Registros')
    XLSX.writeFile(wb, `registros_${fechaDesde}_${fechaHasta}.xlsx`)
  }

  return (
    <PageLayout
      title="Registros de Acceso"
      subtitle={`${registrosFiltrados.length} registro${registrosFiltrados.length !== 1 ? 's' : ''}`}
      actions={
        <Button variant="secondary" size="sm" icon={<Download size={15} />} onClick={exportarExcel}>
          Exportar
        </Button>
      }
    >
      {/* Filtros */}
      <Card className="mb-4" padding="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAAAAA]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nombre, DNI, empresa..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F8F8F6] border border-[rgba(0,0,0,0.1)] rounded-clay-sm outline-none focus:border-[#7F77DD] transition-colors"
            />
          </div>

          {/* Equipo */}
          <select
            value={equipoId}
            onChange={(e) => setEquipoId(e.target.value)}
            className="w-full py-2.5 px-4 text-sm bg-[#F8F8F6] border border-[rgba(0,0,0,0.1)] rounded-clay-sm outline-none focus:border-[#7F77DD] transition-colors appearance-none"
          >
            <option value="">Todos los equipos</option>
            {(equipos ?? []).map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.nombre_equipo}</option>
            ))}
          </select>

          {/* Fecha desde */}
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full py-2.5 px-4 text-sm bg-[#F8F8F6] border border-[rgba(0,0,0,0.1)] rounded-clay-sm outline-none focus:border-[#7F77DD] transition-colors"
          />

          {/* Fecha hasta */}
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-full py-2.5 px-4 text-sm bg-[#F8F8F6] border border-[rgba(0,0,0,0.1)] rounded-clay-sm outline-none focus:border-[#7F77DD] transition-colors"
          />
        </div>
      </Card>

      {/* Tabla */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.06)]">
                <th className="text-left text-xs font-medium text-[#888780] px-5 py-3">Persona</th>
                <th className="text-left text-xs font-medium text-[#888780] px-3 py-3 hidden md:table-cell">Empresa</th>
                <th className="text-left text-xs font-medium text-[#888780] px-3 py-3 hidden lg:table-cell">Motivo</th>
                <th className="text-left text-xs font-medium text-[#888780] px-3 py-3">Ingreso</th>
                <th className="text-left text-xs font-medium text-[#888780] px-3 py-3 hidden md:table-cell">Egreso</th>
                <th className="text-left text-xs font-medium text-[#888780] px-3 py-3">Estado</th>
                <th className="text-left text-xs font-medium text-[#888780] px-3 py-3 hidden lg:table-cell">Incidente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5"><SkeletonRow /></td></tr>
                ))
              ) : registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-[#888780] py-10">
                    Sin registros para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8F8F6] transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#2C2C2A]">{r.nombre_completo}</p>
                      <p className="text-xs text-[#888780]">DNI {r.dni}</p>
                    </td>
                    <td className="px-3 py-3 text-[#5F5E5A] hidden md:table-cell">
                      {r.empresa_visitante_nombre || '—'}
                    </td>
                    <td className="px-3 py-3 text-[#5F5E5A] hidden lg:table-cell">
                      {r.motivo_visita}
                    </td>
                    <td className="px-3 py-3 text-[#5F5E5A] text-xs">
                      {new Date(r.fecha_ingreso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-3 text-[#5F5E5A] text-xs hidden md:table-cell">
                      {r.fecha_egreso
                        ? new Date(r.fecha_egreso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : <span className="text-[#1D9E75]">Dentro</span>
                      }
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={r.estado === 'dentro' ? 'dentro' : r.estado === 'afuera' ? 'afuera' : 'neutral'} showDot>
                        {r.estado === 'dentro' ? 'Dentro' : r.estado === 'afuera' ? 'Salió' : 'Anulado'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      {r.declara_incidente == null ? (
                        <span className="text-xs text-[#AAAAAA]">—</span>
                      ) : r.declara_incidente ? (
                        <Badge variant="danger">⚠️ Sí</Badge>
                      ) : (
                        <Badge variant="activo">No</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageLayout>
  )
}
