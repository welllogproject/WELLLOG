import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { useEquipos, useCrearEquipo, useActualizarEquipo, useEliminarEquipo, type EquipoForm } from '@/hooks/useEquipos'
import { useLocaciones } from '@/hooks/useLocaciones'
import { useTodosUsuarios } from '@/hooks/useEmpresas'
import type { Equipo, EstadoEquipo, TipoEquipo } from '@/types/models'
import { Plus, Pencil, Trash2, Search, Settings2 } from 'lucide-react'

const TIPO_LABELS: Record<TipoEquipo, string> = {
  torre: 'Torre', perforadora: 'Perforadora', plataforma: 'Plataforma',
  workover: 'Workover', otro: 'Otro',
}
const ESTADO_VARIANT: Record<EstadoEquipo, 'activo' | 'warning' | 'inactivo'> = {
  activo: 'activo', mantenimiento: 'warning', inactivo: 'inactivo',
}
const ESTADO_LABELS: Record<EstadoEquipo, string> = {
  activo: 'Operativo', mantenimiento: 'Mantenimiento', inactivo: 'Inactivo',
}

const EMPTY: EquipoForm = { nombre_equipo: '', tipo_equipo: 'torre', estado: 'activo' }

export function GestionEquipos() {
  const { data: equipos = [], isLoading } = useEquipos()
  const { data: locaciones = [] } = useLocaciones()
  const { data: usuarios = [] } = useTodosUsuarios()
  const crear = useCrearEquipo()
  const actualizar = useActualizarEquipo()
  const eliminar = useEliminarEquipo()

  const operadores = usuarios.filter((u) => u.rol === 'operador' || u.rol === 'supervisor')

  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState<EstadoEquipo | 'todos'>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Equipo | null>(null)
  const [editando, setEditando] = useState<Equipo | null>(null)
  const [form, setForm] = useState<EquipoForm>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof EquipoForm, string>>>({})

  const filtrados = equipos.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch = e.nombre_equipo.toLowerCase().includes(q) ||
      (e.locacion?.codigo ?? '').toLowerCase().includes(q)
    const matchEstado = filterEstado === 'todos' || e.estado === filterEstado
    return matchSearch && matchEstado
  })

  function abrirCrear() {
    setEditando(null); setForm(EMPTY); setErrors({}); setModalOpen(true)
  }

  function abrirEditar(eq: Equipo) {
    setEditando(eq)
    setForm({
      nombre_equipo: eq.nombre_equipo,
      tipo_equipo: eq.tipo_equipo,
      descripcion: eq.descripcion ?? '',
      estado: eq.estado,
      locacion_actual_id: eq.locacion_actual_id ?? '',
      operador_asignado_id: eq.operador_asignado_id ?? '',
    })
    setErrors({}); setModalOpen(true)
  }

  function validar() {
    const e: typeof errors = {}
    if (!form.nombre_equipo.trim()) e.nombre_equipo = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleGuardar() {
    if (!validar()) return
    const payload = {
      ...form,
      locacion_actual_id: form.locacion_actual_id || undefined,
      operador_asignado_id: form.operador_asignado_id || undefined,
    }
    if (editando) await actualizar.mutateAsync({ id: editando.id, ...payload })
    else await crear.mutateAsync(payload)
    setModalOpen(false)
  }

  return (
    <PageLayout
      title="Equipos"
      subtitle="Torres, perforadoras y equipos de trabajo"
      actions={
        <Button variant="ingreso" size="sm" onClick={abrirCrear}>
          <Plus size={16} className="mr-1.5" /> Nuevo equipo
        </Button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faded)]" />
          <input type="text" placeholder="Buscar por nombre o locación..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'activo', 'mantenimiento', 'inactivo'] as const).map((e) => (
            <button key={e} onClick={() => setFilterEstado(e)}
              className={`px-3 py-2 text-xs font-medium rounded-[8px] transition-all ${filterEstado === e ? 'bg-[#7F77DD]/10 text-[#534AB7]' : 'bg-[var(--card-bg)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'}`}>
              {e === 'todos' ? 'Todos' : ESTADO_LABELS[e as EstadoEquipo]}
            </button>
          ))}
        </div>
      </div>

      <Table<Equipo>
        columns={[
          {
            key: 'nombre', header: 'Equipo',
            render: (e) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#7F77DD]/10 flex items-center justify-center">
                  <Settings2 size={14} className="text-[#534AB7]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{e.nombre_equipo}</p>
                  {e.tipo_equipo && <p className="text-xs text-[var(--text-muted)]">{TIPO_LABELS[e.tipo_equipo]}</p>}
                </div>
              </div>
            ),
          },
          {
            key: 'locacion', header: 'Locación',
            render: (e) => e.locacion
              ? <span className="font-mono text-xs font-medium text-[var(--text-primary)]">{e.locacion.codigo}</span>
              : <span className="text-xs text-[var(--text-muted)]">Sin asignar</span>,
          },
          {
            key: 'operador', header: 'Operador asignado',
            render: (e) => e.operador
              ? <div><p className="text-sm text-[var(--text-primary)]">{e.operador.nombre_completo}</p><p className="text-xs text-[var(--text-muted)]">{e.operador.email}</p></div>
              : <span className="text-xs text-[var(--text-muted)]">Sin asignar</span>,
          },
          {
            key: 'estado', header: 'Estado',
            render: (e) => <Badge variant={ESTADO_VARIANT[e.estado]} showDot size="sm">{ESTADO_LABELS[e.estado]}</Badge>,
          },
          {
            key: 'acciones', header: '', cellClass: 'text-right',
            render: (e) => (
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => abrirEditar(e)} className="p-1.5 rounded-lg hover:bg-[#7F77DD]/10 text-[var(--text-muted)] hover:text-[#534AB7] transition-colors" title="Editar"><Pencil size={14} /></button>
                <button onClick={() => setConfirmDelete(e)} className="p-1.5 rounded-lg hover:bg-[#E24B4A]/10 text-[var(--text-muted)] hover:text-[#E24B4A] transition-colors" title="Eliminar"><Trash2 size={14} /></button>
              </div>
            ),
          },
        ]}
        data={filtrados} rowKey={(e) => e.id} isLoading={isLoading} emptyMessage="No hay equipos registrados"
      />

      {/* Modal crear/editar */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? `Editar — ${editando.nombre_equipo}` : 'Nuevo equipo'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Nombre del equipo" value={form.nombre_equipo} onChange={(e) => setForm({ ...form, nombre_equipo: e.target.value })} error={errors.nombre_equipo} required placeholder="Ej: V51" />
          </div>
          <Select label="Tipo" value={form.tipo_equipo ?? ''} onChange={(e) => setForm({ ...form, tipo_equipo: e.target.value as TipoEquipo })}
            options={[
              { value: 'torre', label: 'Torre' }, { value: 'perforadora', label: 'Perforadora' },
              { value: 'plataforma', label: 'Plataforma' }, { value: 'workover', label: 'Workover' }, { value: 'otro', label: 'Otro' },
            ]} required />
          <Select label="Estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoEquipo })}
            options={[
              { value: 'activo', label: 'Operativo' }, { value: 'mantenimiento', label: 'En mantenimiento' }, { value: 'inactivo', label: 'Inactivo' },
            ]} required />
          <Select label="Locación actual" value={form.locacion_actual_id ?? ''}
            onChange={(e) => setForm({ ...form, locacion_actual_id: e.target.value })}
            options={locaciones.map((l) => ({ value: l.id, label: `${l.codigo}${l.nombre ? ` — ${l.nombre}` : ''}` }))}
            placeholder="Sin asignar" />
          <Select label="Operador asignado" value={form.operador_asignado_id ?? ''}
            onChange={(e) => setForm({ ...form, operador_asignado_id: e.target.value })}
            options={operadores.map((u) => ({ value: u.id, label: u.nombre_completo }))}
            placeholder="Sin asignar" />
          <div className="sm:col-span-2">
            <Input label="Descripción (opcional)" value={form.descripcion ?? ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del equipo..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="ingreso" size="sm" onClick={handleGuardar} loading={crear.isPending || actualizar.isPending}>
            {editando ? 'Guardar cambios' : 'Crear equipo'}
          </Button>
        </div>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar equipo" size="sm">
        <p className="text-sm text-[var(--text-secondary)]">
          ¿Eliminar <span className="font-medium text-[var(--text-primary)]">{confirmDelete?.nombre_equipo}</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="danger" size="sm" loading={eliminar.isPending}
            onClick={async () => { await eliminar.mutateAsync(confirmDelete!.id); setConfirmDelete(null) }}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
