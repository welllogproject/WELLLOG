import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useLocaciones, useCrearLocacion, useActualizarLocacion, type LocacionForm } from '@/hooks/useLocaciones'
import type { Locacion } from '@/types/models'
import { Plus, Pencil, ToggleLeft, ToggleRight, MapPin, Search } from 'lucide-react'

const EMPTY: LocacionForm = { codigo: '', nombre: '', descripcion: '', activa: true }

export function GestionLocaciones() {
  const { data: locaciones = [], isLoading } = useLocaciones()
  const crear = useCrearLocacion()
  const actualizar = useActualizarLocacion()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Locacion | null>(null)
  const [form, setForm] = useState<LocacionForm>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof LocacionForm, string>>>({})

  const filtradas = locaciones.filter((l) =>
    l.codigo.toLowerCase().includes(search.toLowerCase()) ||
    (l.nombre ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function abrirCrear() {
    setEditando(null); setForm(EMPTY); setErrors({}); setModalOpen(true)
  }

  function abrirEditar(loc: Locacion) {
    setEditando(loc)
    setForm({ codigo: loc.codigo, nombre: loc.nombre ?? '', descripcion: loc.descripcion ?? '', activa: loc.activa })
    setErrors({}); setModalOpen(true)
  }

  function validar() {
    const e: typeof errors = {}
    if (!form.codigo.trim()) e.codigo = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleGuardar() {
    if (!validar()) return
    if (editando) await actualizar.mutateAsync({ id: editando.id, ...form })
    else await crear.mutateAsync(form)
    setModalOpen(false)
  }

  async function toggleActiva(loc: Locacion) {
    await actualizar.mutateAsync({ id: loc.id, ...form, codigo: loc.codigo, activa: !loc.activa })
  }

  return (
    <PageLayout
      title="Locaciones"
      subtitle="Pozos y áreas donde operan los equipos"
      actions={
        <Button variant="ingreso" size="sm" onClick={abrirCrear}>
          <Plus size={16} className="mr-1.5" /> Nueva locación
        </Button>
      }
    >
      <div className="relative max-w-xs mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faded)]" />
        <input
          type="text" placeholder="Buscar por código o nombre..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15 transition-all"
        />
      </div>

      <Table<Locacion>
        columns={[
          {
            key: 'codigo', header: 'Código',
            render: (l) => (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-[#1D9E75]/10 flex items-center justify-center">
                  <MapPin size={14} className="text-[#1D9E75]" />
                </div>
                <span className="font-medium text-[var(--text-primary)] font-mono">{l.codigo}</span>
              </div>
            ),
          },
          { key: 'nombre', header: 'Nombre', render: (l) => <span className="text-[var(--text-secondary)]">{l.nombre ?? '—'}</span> },
          { key: 'descripcion', header: 'Descripción', render: (l) => <span className="text-[var(--text-muted)] text-xs">{l.descripcion ?? '—'}</span> },
          {
            key: 'ubicacion', header: 'Coordenadas',
            render: (l) => l.ubicacion_punto
              ? <span className="font-mono text-xs text-[#534AB7]">{(l.ubicacion_punto as any).lat?.toFixed(4)}, {(l.ubicacion_punto as any).lng?.toFixed(4)}</span>
              : <span className="text-xs text-[var(--text-muted)]">Sin coordenadas</span>,
          },
          {
            key: 'activa', header: 'Estado',
            render: (l) => <Badge variant={l.activa ? 'activo' : 'inactivo'} showDot size="sm">{l.activa ? 'Activa' : 'Inactiva'}</Badge>,
          },
          {
            key: 'acciones', header: '', cellClass: 'text-right',
            render: (l) => (
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => abrirEditar(l)} className="p-1.5 rounded-lg hover:bg-[#7F77DD]/10 text-[var(--text-muted)] hover:text-[#534AB7] transition-colors" title="Editar"><Pencil size={14} /></button>
                <button onClick={() => toggleActiva(l)} className={`p-1.5 rounded-lg transition-colors ${l.activa ? 'hover:bg-[#E24B4A]/10 text-[var(--text-muted)] hover:text-[#E24B4A]' : 'hover:bg-[#1D9E75]/10 text-[var(--text-muted)] hover:text-[#1D9E75]'}`} title={l.activa ? 'Desactivar' : 'Activar'}>
                  {l.activa ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
              </div>
            ),
          },
        ]}
        data={filtradas} rowKey={(l) => l.id} isLoading={isLoading} emptyMessage="No hay locaciones registradas"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? `Editar — ${editando.codigo}` : 'Nueva locación'} size="md">
        <div className="flex flex-col gap-4">
          <Input label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} error={errors.codigo} required placeholder="Ej: AAB 1012" />
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Área AAB 1012" />
          <Input label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Área norte, cuenca neuquina" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitud (opcional)" type="number" step="0.0001" value={form.lat ?? ''} onChange={(e) => setForm({ ...form, lat: e.target.value ? Number(e.target.value) : undefined })} placeholder="-38.4161" />
            <Input label="Longitud (opcional)" type="number" step="0.0001" value={form.lng ?? ''} onChange={(e) => setForm({ ...form, lng: e.target.value ? Number(e.target.value) : undefined })} placeholder="-63.5989" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="ingreso" size="sm" onClick={handleGuardar} loading={crear.isPending || actualizar.isPending}>
            {editando ? 'Guardar cambios' : 'Crear locación'}
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
