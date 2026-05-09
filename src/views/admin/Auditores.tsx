import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { usePermisosAcceso, useCrearPermiso, useTogglePermiso, useOperadoras, type PermisoForm } from '@/hooks/useEmpresas'
import { useEquipos } from '@/hooks/useEquipos'
import { useAuthStore } from '@/stores/authStore'
import type { PermisoAcceso, TipoAcceso } from '@/types/models'
import { Plus, ToggleLeft, ToggleRight, Info, ShieldCheck } from 'lucide-react'

const ACCESO_LABELS: Record<TipoAcceso, string> = {
  lectura: 'Solo lectura', lectura_en_vivo: 'Tiempo real', reporte: 'Solo reportes',
}

const HOY = new Date().toISOString().split('T')[0]

export function Auditores() {
  const empresaId = useAuthStore((s) => s.empresaId())
  const { data: todosPermisos = [], isLoading } = usePermisosAcceso()
  const { data: operadoras = [] } = useOperadoras()
  const { data: equipos = [] } = useEquipos()
  const crear = useCrearPermiso()
  const toggle = useTogglePermiso()

  // Solo permisos donde esta empresa es la propietaria
  const permisos = todosPermisos.filter((p) => p.empresa_propietaria_id === empresaId)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<PermisoForm>({
    empresa_propietaria_id: empresaId ?? '',
    empresa_auditora_id: '',
    tipo_acceso: 'lectura_en_vivo',
    puede_ver_incidentes: false,
    puede_ver_hse: false,
    puede_ver_coordenadas: false,
    fecha_inicio: HOY,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof PermisoForm, string>>>({})

  function validar() {
    const e: typeof errors = {}
    if (!form.empresa_auditora_id) e.empresa_auditora_id = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleGuardar() {
    if (!validar()) return
    await crear.mutateAsync({ ...form, empresa_propietaria_id: empresaId!, equipo_id: form.equipo_id || undefined, fecha_fin: form.fecha_fin || undefined })
    setModalOpen(false)
  }

  return (
    <PageLayout
      title="Auditores"
      subtitle="Empresas operadoras con acceso a tus datos (YPF, etc.)"
      actions={
        <Button variant="ingreso" size="sm" onClick={() => { setErrors({}); setModalOpen(true) }}>
          <Plus size={16} className="mr-1.5" /> Habilitar acceso
        </Button>
      }
    >
      <div className="bg-[#1D9E75]/8 border border-[#1D9E75]/20 rounded-[12px] p-4 mb-5 flex gap-3">
        <Info size={16} className="text-[#0F6E56] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#0F6E56]">
          Desde acá controlás quién puede ver tus registros. Cada permiso es independiente —
          podés dar acceso a YPF para el equipo V51 sin que vea Venver 10.
        </p>
      </div>

      <Table<PermisoAcceso>
        columns={[
          {
            key: 'auditora', header: 'Operadora con acceso',
            render: (p) => (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-[#1D9E75]/10 flex items-center justify-center">
                  <ShieldCheck size={14} className="text-[#0F6E56]" />
                </div>
                <span className="font-medium text-[var(--text-primary)]">{p.empresa_auditora?.nombre ?? '—'}</span>
              </div>
            ),
          },
          {
            key: 'equipo', header: 'Equipo',
            render: (p) => p.equipo
              ? <Badge variant="neutral" size="sm">{p.equipo.nombre_equipo}</Badge>
              : <span className="text-xs text-[var(--text-muted)] italic">Todos los equipos</span>,
          },
          {
            key: 'tipo_acceso', header: 'Acceso',
            render: (p) => <Badge variant="info" size="sm">{ACCESO_LABELS[p.tipo_acceso]}</Badge>,
          },
          {
            key: 'permisos', header: 'Puede ver',
            render: (p) => (
              <div className="flex flex-wrap gap-1">
                {p.puede_ver_incidentes && <span className="text-[10px] px-1.5 py-0.5 bg-[#E24B4A]/10 text-[#b93332] rounded-full">Incidentes</span>}
                {p.puede_ver_hse && <span className="text-[10px] px-1.5 py-0.5 bg-[#BA7517]/10 text-[#7A4E0F] rounded-full">HSE</span>}
                {p.puede_ver_coordenadas && <span className="text-[10px] px-1.5 py-0.5 bg-[#7F77DD]/10 text-[#534AB7] rounded-full">Coords exactas</span>}
                {!p.puede_ver_incidentes && !p.puede_ver_hse && !p.puede_ver_coordenadas && <span className="text-xs text-[var(--text-muted)]">Solo registros</span>}
              </div>
            ),
          },
          {
            key: 'vigencia', header: 'Vigencia',
            render: (p) => <span className="text-xs text-[var(--text-secondary)]">{p.fecha_inicio}{p.fecha_fin ? ` → ${p.fecha_fin}` : ' → Sin vencimiento'}</span>,
          },
          {
            key: 'activo', header: 'Estado',
            render: (p) => <Badge variant={p.activo ? 'activo' : 'inactivo'} showDot size="sm">{p.activo ? 'Activo' : 'Revocado'}</Badge>,
          },
          {
            key: 'acciones', header: '', cellClass: 'text-right',
            render: (p) => (
              <button onClick={() => toggle.mutate({ id: p.id, activo: !p.activo })}
                className={`p-1.5 rounded-lg transition-colors ${p.activo ? 'hover:bg-[#E24B4A]/10 text-[var(--text-muted)] hover:text-[#E24B4A]' : 'hover:bg-[#1D9E75]/10 text-[var(--text-muted)] hover:text-[#1D9E75]'}`}
                title={p.activo ? 'Revocar' : 'Activar'}>
                {p.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
            ),
          },
        ]}
        data={permisos} rowKey={(p) => p.id} isLoading={isLoading} emptyMessage="No hay accesos habilitados todavía"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Habilitar acceso a operadora" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Select label="Operadora que recibirá acceso" value={form.empresa_auditora_id}
              onChange={(e) => setForm({ ...form, empresa_auditora_id: e.target.value })}
              options={operadoras.map((e) => ({ value: e.id, label: e.nombre }))}
              placeholder="Seleccionar operadora..." error={errors.empresa_auditora_id} required />
          </div>
          <Select label="Equipo (vacío = todos)" value={form.equipo_id ?? ''}
            onChange={(e) => setForm({ ...form, equipo_id: e.target.value || undefined })}
            options={equipos.map((e) => ({ value: e.id, label: e.nombre_equipo }))}
            placeholder="Todos los equipos" />
          <Select label="Tipo de acceso" value={form.tipo_acceso}
            onChange={(e) => setForm({ ...form, tipo_acceso: e.target.value as TipoAcceso })}
            options={[
              { value: 'lectura', label: 'Solo lectura' },
              { value: 'lectura_en_vivo', label: 'Tiempo real' },
              { value: 'reporte', label: 'Solo reportes' },
            ]} required />
          <Input label="Desde" type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} required />
          <Input label="Hasta (opcional)" type="date" value={form.fecha_fin ?? ''} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value || undefined })} />
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Datos adicionales visibles</p>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'puede_ver_incidentes', label: 'Incidentes HSE' },
                { key: 'puede_ver_hse', label: 'Índices HSE' },
                { key: 'puede_ver_coordenadas', label: 'Coordenadas exactas' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[key as keyof PermisoForm] as boolean}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#7F77DD]" />
                  <span className="text-sm text-[var(--text-primary)]">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="ingreso" size="sm" onClick={handleGuardar} loading={crear.isPending}>Habilitar acceso</Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
