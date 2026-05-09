import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import {
  useTodasEmpresas,
  useCrearEmpresa,
  useActualizarEmpresa,
  type EmpresaForm,
} from '@/hooks/useEmpresas'
import type { Empresa, PlanEmpresa, TipoEmpresa } from '@/types/models'
import { Plus, Pencil, ToggleLeft, ToggleRight, Search } from 'lucide-react'

const PLAN_LABELS: Record<PlanEmpresa, string> = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' }
const PLAN_VARIANT: Record<PlanEmpresa, 'neutral' | 'info' | 'dentro'> = {
  free: 'neutral', pro: 'info', enterprise: 'dentro',
}
const TIPO_LABELS: Record<TipoEmpresa, string> = { contratista: 'Contratista', operadora: 'Operadora' }

const EMPTY_FORM: EmpresaForm = {
  nombre: '',
  tipo: 'contratista',
  razon_social: '',
  cuit: '',
  email_contacto: '',
  telefono: '',
  plan: 'free',
}

export function GestionEmpresas() {
  const { data: empresas = [], isLoading } = useTodasEmpresas()
  const crear = useCrearEmpresa()
  const actualizar = useActualizarEmpresa()

  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<'todas' | TipoEmpresa>('todas')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Empresa | null>(null)
  const [form, setForm] = useState<EmpresaForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof EmpresaForm, string>>>({})

  const filtradas = empresas.filter((e) => {
    const matchSearch = e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (e.cuit ?? '').includes(search) ||
      (e.email_contacto ?? '').toLowerCase().includes(search.toLowerCase())
    const matchTipo = filterTipo === 'todas' || e.tipo === filterTipo
    return matchSearch && matchTipo
  })

  function abrirCrear() {
    setEditando(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  function abrirEditar(empresa: Empresa) {
    setEditando(empresa)
    setForm({
      nombre: empresa.nombre,
      tipo: empresa.tipo,
      razon_social: empresa.razon_social ?? '',
      cuit: empresa.cuit ?? '',
      email_contacto: empresa.email_contacto ?? '',
      telefono: empresa.telefono ?? '',
      plan: empresa.plan,
    })
    setErrors({})
    setModalOpen(true)
  }

  function validar(): boolean {
    const e: typeof errors = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (form.cuit && !/^\d{10,11}$/.test(form.cuit.replace(/-/g, ''))) {
      e.cuit = 'CUIT inválido'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleGuardar() {
    if (!validar()) return
    if (editando) {
      await actualizar.mutateAsync({ id: editando.id, ...form })
    } else {
      await crear.mutateAsync(form)
    }
    setModalOpen(false)
  }

  async function toggleActiva(empresa: Empresa) {
    await actualizar.mutateAsync({ id: empresa.id, activa: !empresa.activa })
  }

  return (
    <PageLayout
      title="Empresas"
      subtitle="Contratistas y operadoras registradas en la plataforma"
      actions={
        <Button variant="ingreso" size="sm" onClick={abrirCrear}>
          <Plus size={16} className="mr-1.5" /> Nueva empresa
        </Button>
      }
    >
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faded)]" />
          <input
            type="text"
            placeholder="Buscar por nombre, CUIT o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['todas', 'contratista', 'operadora'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterTipo(t)}
              className={[
                'px-3 py-2 text-xs font-medium rounded-[8px] transition-all',
                filterTipo === t
                  ? 'bg-[#7F77DD]/10 text-[#534AB7]'
                  : 'bg-[var(--card-bg)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]',
              ].join(' ')}
            >
              {t === 'todas' ? 'Todas' : TIPO_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <Table<Empresa>
        columns={[
          {
            key: 'nombre',
            header: 'Empresa',
            render: (e) => (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                  style={{ background: e.tipo === 'contratista' ? '#7F77DD' : '#1D9E75' }}
                >
                  {e.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{e.nombre}</p>
                  {e.razon_social && (
                    <p className="text-xs text-[var(--text-muted)]">{e.razon_social}</p>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'tipo',
            header: 'Tipo',
            render: (e) => (
              <Badge variant={e.tipo === 'contratista' ? 'info' : 'dentro'} size="sm">
                {TIPO_LABELS[e.tipo]}
              </Badge>
            ),
          },
          {
            key: 'cuit',
            header: 'CUIT',
            render: (e) => <span className="text-[var(--text-secondary)] font-mono text-xs">{e.cuit ?? '—'}</span>,
          },
          {
            key: 'email_contacto',
            header: 'Email',
            render: (e) => <span className="text-[var(--text-secondary)]">{e.email_contacto ?? '—'}</span>,
          },
          {
            key: 'plan',
            header: 'Plan',
            render: (e) => (
              <Badge variant={PLAN_VARIANT[e.plan]} size="sm">{PLAN_LABELS[e.plan]}</Badge>
            ),
          },
          {
            key: 'activa',
            header: 'Estado',
            render: (e) => (
              <Badge variant={e.activa ? 'activo' : 'inactivo'} showDot size="sm">
                {e.activa ? 'Activa' : 'Suspendida'}
              </Badge>
            ),
          },
          {
            key: 'acciones',
            header: '',
            cellClass: 'text-right',
            render: (e) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => abrirEditar(e)}
                  className="p-1.5 rounded-lg hover:bg-[#7F77DD]/10 text-[var(--text-muted)] hover:text-[#534AB7] transition-colors"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => toggleActiva(e)}
                  className={[
                    'p-1.5 rounded-lg transition-colors',
                    e.activa
                      ? 'hover:bg-[#E24B4A]/10 text-[var(--text-muted)] hover:text-[#E24B4A]'
                      : 'hover:bg-[#1D9E75]/10 text-[var(--text-muted)] hover:text-[#1D9E75]',
                  ].join(' ')}
                  title={e.activa ? 'Suspender' : 'Activar'}
                >
                  {e.activa ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
              </div>
            ),
          },
        ]}
        data={filtradas}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        emptyMessage="No se encontraron empresas"
      />

      {/* Modal crear/editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? `Editar — ${editando.nombre}` : 'Nueva empresa'}
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Nombre de la empresa"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              error={errors.nombre}
              required
              placeholder="Ej: Venver"
            />
          </div>
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoEmpresa })}
            options={[
              { value: 'contratista', label: 'Contratista' },
              { value: 'operadora', label: 'Operadora' },
            ]}
            required
          />
          <Select
            label="Plan"
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value as PlanEmpresa })}
            options={[
              { value: 'free', label: 'Free' },
              { value: 'pro', label: 'Pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="Razón social"
              value={form.razon_social}
              onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
              placeholder="Ej: Venver S.A."
            />
          </div>
          <Input
            label="CUIT"
            value={form.cuit}
            onChange={(e) => setForm({ ...form, cuit: e.target.value })}
            error={errors.cuit}
            placeholder="20123456789"
          />
          <Input
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="+54 299 4000000"
          />
          <div className="sm:col-span-2">
            <Input
              label="Email de contacto"
              type="email"
              value={form.email_contacto}
              onChange={(e) => setForm({ ...form, email_contacto: e.target.value })}
              placeholder="admin@empresa.com"
            />
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
            loading={crear.isPending || actualizar.isPending}
          >
            {editando ? 'Guardar cambios' : 'Crear empresa'}
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
