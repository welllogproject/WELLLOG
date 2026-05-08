import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import {
  usePermisosAcceso,
  useCrearPermiso,
  useTogglePermiso,
  useContratistas,
  useOperadoras,
  type PermisoForm,
} from '@/hooks/useEmpresas'
import { useEquipos } from '@/hooks/useEquipos'
import type { PermisoAcceso, TipoAcceso } from '@/types/models'
import { Plus, ToggleLeft, ToggleRight, Info } from 'lucide-react'

const ACCESO_LABELS: Record<TipoAcceso, string> = {
  lectura: 'Solo lectura',
  lectura_en_vivo: 'Tiempo real',
  reporte: 'Solo reportes',
}

const ACCESO_VARIANT: Record<TipoAcceso, 'neutral' | 'info' | 'dentro'> = {
  lectura: 'neutral',
  lectura_en_vivo: 'info',
  reporte: 'neutral',
}

const HOY = new Date().toISOString().split('T')[0]

const EMPTY_FORM: PermisoForm = {
  empresa_propietaria_id: '',
  empresa_auditora_id: '',
  equipo_id: undefined,
  tipo_acceso: 'lectura_en_vivo',
  puede_ver_incidentes: false,
  puede_ver_hse: false,
  puede_ver_coordenadas: false,
  fecha_inicio: HOY,
  fecha_fin: undefined,
}

export function PermisosAcceso() {
  const { data: permisos = [], isLoading } = usePermisosAcceso()
  const { data: contratistas = [] } = useContratistas()
  const { data: operadoras = [] } = useOperadoras()
  const { data: equipos = [] } = useEquipos()
  const crear = useCrearPermiso()
  const toggle = useTogglePermiso()

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<PermisoForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof PermisoForm, string>>>({})

  const equiposFiltrados = form.empresa_propietaria_id
    ? equipos.filter((e) => e.empresa_contratista_id === form.empresa_propietaria_id)
    : equipos

  function abrirCrear() {
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  function validar(): boolean {
    const e: typeof errors = {}
    if (!form.empresa_propietaria_id) e.empresa_propietaria_id = 'Requerido'
    if (!form.empresa_auditora_id) e.empresa_auditora_id = 'Requerido'
    if (form.empresa_propietaria_id === form.empresa_auditora_id) {
      e.empresa_auditora_id = 'No puede ser la misma empresa'
    }
    if (!form.fecha_inicio) e.fecha_inicio = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleGuardar() {
    if (!validar()) return
    await crear.mutateAsync({
      ...form,
      equipo_id: form.equipo_id || undefined,
      fecha_fin: form.fecha_fin || undefined,
    })
    setModalOpen(false)
  }

  return (
    <PageLayout
      title="Permisos de Acceso"
      subtitle="Control de qué contratistas comparten datos con qué operadoras"
      actions={
        <Button variant="ingreso" size="sm" onClick={abrirCrear}>
          <Plus size={16} className="mr-1.5" /> Nuevo permiso
        </Button>
      }
    >
      {/* Explicación del modelo */}
      <div className="bg-[#7F77DD]/8 border border-[#7F77DD]/20 rounded-[12px] p-4 mb-5 flex gap-3">
        <Info size={16} className="text-[#534AB7] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#534AB7]">
          <p className="font-medium mb-0.5">Modelo multi-tenant</p>
          <p className="text-xs text-[#5F5E5A]">
            Cada contratista decide de forma independiente qué datos comparte con cada operadora.
            Una operadora como YPF puede recibir acceso de múltiples contratistas a la vez —
            cada relación es independiente y revocable por separado.
          </p>
        </div>
      </div>

      <Table<PermisoAcceso>
        columns={[
          {
            key: 'propietaria',
            header: 'Contratista',
            render: (p) => (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#7F77DD]/15 flex items-center justify-center text-xs font-semibold text-[#534AB7]">
                  {(p.empresa_propietaria?.nombre ?? '?').charAt(0)}
                </div>
                <span className="font-medium text-[#2C2C2A]">
                  {p.empresa_propietaria?.nombre ?? '—'}
                </span>
              </div>
            ),
          },
          {
            key: 'auditora',
            header: 'Operadora',
            render: (p) => (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#1D9E75]/15 flex items-center justify-center text-xs font-semibold text-[#0F6E56]">
                  {(p.empresa_auditora?.nombre ?? '?').charAt(0)}
                </div>
                <span className="font-medium text-[#2C2C2A]">
                  {p.empresa_auditora?.nombre ?? '—'}
                </span>
              </div>
            ),
          },
          {
            key: 'equipo',
            header: 'Equipo',
            render: (p) =>
              p.equipo ? (
                <Badge variant="neutral" size="sm">{p.equipo.nombre_equipo}</Badge>
              ) : (
                <span className="text-xs text-[#888780] italic">Todos los equipos</span>
              ),
          },
          {
            key: 'tipo_acceso',
            header: 'Tipo de acceso',
            render: (p) => (
              <Badge variant={ACCESO_VARIANT[p.tipo_acceso]} size="sm">
                {ACCESO_LABELS[p.tipo_acceso]}
              </Badge>
            ),
          },
          {
            key: 'permisos',
            header: 'Ve',
            render: (p) => (
              <div className="flex flex-wrap gap-1">
                {p.puede_ver_incidentes && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#E24B4A]/10 text-[#b93332] rounded-full">
                    Incidentes
                  </span>
                )}
                {p.puede_ver_hse && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#BA7517]/10 text-[#7A4E0F] rounded-full">
                    HSE
                  </span>
                )}
                {p.puede_ver_coordenadas && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#7F77DD]/10 text-[#534AB7] rounded-full">
                    Coordenadas
                  </span>
                )}
                {!p.puede_ver_incidentes && !p.puede_ver_hse && !p.puede_ver_coordenadas && (
                  <span className="text-xs text-[#888780]">Solo registros</span>
                )}
              </div>
            ),
          },
          {
            key: 'vigencia',
            header: 'Vigencia',
            render: (p) => (
              <div className="text-xs text-[#5F5E5A]">
                <span>{p.fecha_inicio}</span>
                {p.fecha_fin && <span> → {p.fecha_fin}</span>}
                {!p.fecha_fin && <span className="text-[#888780]"> → Sin vencimiento</span>}
              </div>
            ),
          },
          {
            key: 'activo',
            header: 'Estado',
            render: (p) => (
              <Badge variant={p.activo ? 'activo' : 'inactivo'} showDot size="sm">
                {p.activo ? 'Activo' : 'Revocado'}
              </Badge>
            ),
          },
          {
            key: 'acciones',
            header: '',
            cellClass: 'text-right',
            render: (p) => (
              <button
                onClick={() => toggle.mutate({ id: p.id, activo: !p.activo })}
                className={[
                  'p-1.5 rounded-lg transition-colors',
                  p.activo
                    ? 'hover:bg-[#E24B4A]/10 text-[#888780] hover:text-[#E24B4A]'
                    : 'hover:bg-[#1D9E75]/10 text-[#888780] hover:text-[#1D9E75]',
                ].join(' ')}
                title={p.activo ? 'Revocar' : 'Activar'}
              >
                {p.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
            ),
          },
        ]}
        data={permisos}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        emptyMessage="No hay permisos configurados"
      />

      {/* Modal nuevo permiso */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo permiso de acceso"
        size="xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Contratista (propietaria de los datos)"
            value={form.empresa_propietaria_id}
            onChange={(e) => {
              setForm({ ...form, empresa_propietaria_id: e.target.value, equipo_id: undefined })
            }}
            options={contratistas.map((e) => ({ value: e.id, label: e.nombre }))}
            placeholder="Seleccionar contratista..."
            error={errors.empresa_propietaria_id}
            required
          />
          <Select
            label="Operadora (quien recibe acceso)"
            value={form.empresa_auditora_id}
            onChange={(e) => setForm({ ...form, empresa_auditora_id: e.target.value })}
            options={operadoras.map((e) => ({ value: e.id, label: e.nombre }))}
            placeholder="Seleccionar operadora..."
            error={errors.empresa_auditora_id}
            required
          />
          <Select
            label="Equipo (opcional — vacío = todos los equipos)"
            value={form.equipo_id ?? ''}
            onChange={(e) => setForm({ ...form, equipo_id: e.target.value || undefined })}
            options={equiposFiltrados.map((e) => ({ value: e.id, label: e.nombre_equipo }))}
            placeholder="Todos los equipos"
          />
          <Select
            label="Tipo de acceso"
            value={form.tipo_acceso}
            onChange={(e) => setForm({ ...form, tipo_acceso: e.target.value as TipoAcceso })}
            options={[
              { value: 'lectura', label: 'Solo lectura' },
              { value: 'lectura_en_vivo', label: 'Tiempo real (Realtime)' },
              { value: 'reporte', label: 'Solo reportes' },
            ]}
            required
          />
          <Input
            label="Fecha de inicio"
            type="date"
            value={form.fecha_inicio}
            onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            error={errors.fecha_inicio}
            required
          />
          <Input
            label="Fecha de vencimiento (opcional)"
            type="date"
            value={form.fecha_fin ?? ''}
            onChange={(e) => setForm({ ...form, fecha_fin: e.target.value || undefined })}
          />

          {/* Permisos adicionales */}
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-[#2C2C2A] mb-3">Datos adicionales que puede ver</p>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'puede_ver_incidentes', label: 'Incidentes HSE' },
                { key: 'puede_ver_hse', label: 'Índices HSE' },
                { key: 'puede_ver_coordenadas', label: 'Coordenadas exactas' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={form[key as keyof PermisoForm] as boolean}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#7F77DD]"
                  />
                  <span className="text-sm text-[#2C2C2A]">{label}</span>
                </label>
              ))}
            </div>
            {form.puede_ver_coordenadas && (
              <p className="text-xs text-[#BA7517] mt-2">
                Atención: coordenadas exactas. Si no se habilita, el auditor verá un offset de ±500m.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="ingreso"
            size="sm"
            onClick={handleGuardar}
            loading={crear.isPending}
          >
            Crear permiso
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
