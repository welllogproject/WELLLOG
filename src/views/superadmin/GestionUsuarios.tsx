import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import {
  useTodosUsuarios,
  useCrearUsuario,
  useActualizarUsuario,
  type UsuarioForm,
} from '@/hooks/useEmpresas'
import { useTodasEmpresas } from '@/hooks/useEmpresas'
import type { Usuario, Empresa, EstadoUsuario } from '@/types/models'
import type { Rol } from '@/types/roles'
import { Plus, Search, UserX, UserCheck } from 'lucide-react'

type UsuarioConEmpresa = Usuario & { empresa?: Empresa }

const ROL_LABELS: Record<Rol, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  operador: 'Operador',
  auditor: 'Auditor',
  supervisor: 'Supervisor',
}

const ROL_VARIANT: Record<Rol, 'danger' | 'info' | 'neutral' | 'warning' | 'dentro'> = {
  superadmin: 'danger',
  admin: 'info',
  operador: 'neutral',
  auditor: 'warning',
  supervisor: 'dentro',
}

const ESTADO_VARIANT: Record<EstadoUsuario, 'activo' | 'inactivo' | 'warning'> = {
  activo: 'activo',
  inactivo: 'inactivo',
  suspendido: 'warning',
}

const EMPTY_FORM: UsuarioForm = {
  empresa_id: '',
  nombre_completo: '',
  email: '',
  rol: 'operador',
  dni: '',
  telefono: '',
}

export function GestionUsuarios() {
  const { data: usuarios = [], isLoading } = useTodosUsuarios()
  const { data: empresas = [] } = useTodasEmpresas()
  const crear = useCrearUsuario()
  const actualizar = useActualizarUsuario()

  const [search, setSearch] = useState('')
  const [filterEmpresa, setFilterEmpresa] = useState('')
  const [filterRol, setFilterRol] = useState<Rol | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<UsuarioConEmpresa | null>(null)
  const [form, setForm] = useState<UsuarioForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof UsuarioForm, string>>>({})

  const filtrados = usuarios.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch =
      u.nombre_completo.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.dni ?? '').includes(q)
    const matchEmpresa = !filterEmpresa || u.empresa_id === filterEmpresa
    const matchRol = !filterRol || u.rol === filterRol
    return matchSearch && matchEmpresa && matchRol
  })

  function abrirCrear() {
    setEditando(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  function abrirEditar(u: UsuarioConEmpresa) {
    setEditando(u)
    setForm({
      empresa_id: u.empresa_id,
      nombre_completo: u.nombre_completo,
      email: u.email,
      rol: u.rol,
      dni: u.dni ?? '',
      telefono: u.telefono ?? '',
    })
    setErrors({})
    setModalOpen(true)
  }

  function validar(): boolean {
    const e: typeof errors = {}
    if (!form.empresa_id) e.empresa_id = 'Requerido'
    if (!form.nombre_completo.trim()) e.nombre_completo = 'Requerido'
    if (!form.email.trim()) e.email = 'Requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleGuardar() {
    if (!validar()) return
    if (editando) {
      await actualizar.mutateAsync({
        id: editando.id,
        rol: form.rol,
        nombre_completo: form.nombre_completo,
        telefono: form.telefono,
      })
    } else {
      await crear.mutateAsync(form)
    }
    setModalOpen(false)
  }

  async function toggleEstado(u: UsuarioConEmpresa) {
    const nuevoEstado: EstadoUsuario = u.estado === 'activo' ? 'suspendido' : 'activo'
    await actualizar.mutateAsync({ id: u.id, estado: nuevoEstado })
  }

  const empresaOptions = [
    { value: '', label: 'Todas las empresas' },
    ...empresas.map((e) => ({ value: e.id, label: e.nombre })),
  ]

  const rolOptions = [
    { value: '', label: 'Todos los roles' },
    ...(['superadmin', 'admin', 'operador', 'auditor', 'supervisor'] as Rol[]).map((r) => ({
      value: r,
      label: ROL_LABELS[r],
    })),
  ]

  return (
    <PageLayout
      title="Usuarios"
      subtitle="Todos los usuarios de la plataforma"
      actions={
        <Button variant="ingreso" size="sm" onClick={abrirCrear}>
          <Plus size={16} className="mr-1.5" /> Invitar usuario
        </Button>
      }
    >
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faded)]" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15 transition-all"
          />
        </div>
        <select
          value={filterEmpresa}
          onChange={(e) => setFilterEmpresa(e.target.value)}
          className="py-2.5 px-3 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] transition-all text-[var(--text-primary)]"
        >
          {empresaOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filterRol}
          onChange={(e) => setFilterRol(e.target.value as Rol | '')}
          className="py-2.5 px-3 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] transition-all text-[var(--text-primary)]"
        >
          {rolOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <Table<UsuarioConEmpresa>
        columns={[
          {
            key: 'nombre_completo',
            header: 'Usuario',
            render: (u) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7F77DD]/15 flex items-center justify-center text-xs font-semibold text-[#534AB7] flex-shrink-0">
                  {u.nombre_completo.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{u.nombre_completo}</p>
                  <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'empresa',
            header: 'Empresa',
            render: (u) => (
              <div>
                <p className="text-[var(--text-primary)]">{u.empresa?.nombre ?? '—'}</p>
                <p className="text-xs text-[var(--text-muted)] capitalize">{u.empresa?.tipo}</p>
              </div>
            ),
          },
          {
            key: 'rol',
            header: 'Rol',
            render: (u) => (
              <Badge variant={ROL_VARIANT[u.rol]} size="sm">{ROL_LABELS[u.rol]}</Badge>
            ),
          },
          {
            key: 'dni',
            header: 'DNI',
            render: (u) => <span className="text-[var(--text-secondary)] font-mono text-xs">{u.dni ?? '—'}</span>,
          },
          {
            key: 'estado',
            header: 'Estado',
            render: (u) => (
              <Badge variant={ESTADO_VARIANT[u.estado]} showDot size="sm">
                {u.estado.charAt(0).toUpperCase() + u.estado.slice(1)}
              </Badge>
            ),
          },
          {
            key: 'acciones',
            header: '',
            cellClass: 'text-right',
            render: (u) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => abrirEditar(u)}
                  className="px-2.5 py-1 text-xs rounded-lg hover:bg-[#7F77DD]/10 text-[var(--text-secondary)] hover:text-[#534AB7] transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleEstado(u)}
                  className={[
                    'p-1.5 rounded-lg transition-colors',
                    u.estado === 'activo'
                      ? 'hover:bg-[#E24B4A]/10 text-[var(--text-muted)] hover:text-[#E24B4A]'
                      : 'hover:bg-[#1D9E75]/10 text-[var(--text-muted)] hover:text-[#1D9E75]',
                  ].join(' ')}
                  title={u.estado === 'activo' ? 'Suspender' : 'Activar'}
                >
                  {u.estado === 'activo' ? <UserX size={14} /> : <UserCheck size={14} />}
                </button>
              </div>
            ),
          },
        ]}
        data={filtrados}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        emptyMessage="No se encontraron usuarios"
      />

      {/* Modal crear/editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? `Editar — ${editando.nombre_completo}` : 'Invitar usuario'}
        size="lg"
      >
        {!editando && (
          <div className="bg-[#7F77DD]/8 text-[#534AB7] text-xs px-3 py-2.5 rounded-[10px] mb-4">
            Se enviará una invitación por email. El usuario elegirá su contraseña al activar la cuenta.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Select
              label="Empresa"
              value={form.empresa_id}
              onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
              options={empresas.map((e) => ({ value: e.id, label: `${e.nombre} (${e.tipo})` }))}
              placeholder="Seleccionar empresa..."
              error={errors.empresa_id}
              required
              disabled={!!editando}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Nombre completo"
              value={form.nombre_completo}
              onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
              error={errors.nombre_completo}
              required
              placeholder="Ej: Carlos García"
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              required
              disabled={!!editando}
              placeholder="usuario@empresa.com"
            />
          </div>
          <Select
            label="Rol"
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
            options={[
              { value: 'superadmin', label: 'Superadmin' },
              { value: 'admin', label: 'Admin' },
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'operador', label: 'Operador' },
              { value: 'auditor', label: 'Auditor' },
            ]}
            required
          />
          <Input
            label="DNI"
            value={form.dni}
            onChange={(e) => setForm({ ...form, dni: e.target.value })}
            placeholder="Ej: 30123456"
          />
          <div className="sm:col-span-2">
            <Input
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="+54 299 4000000"
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
            {editando ? 'Guardar cambios' : 'Enviar invitación'}
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
