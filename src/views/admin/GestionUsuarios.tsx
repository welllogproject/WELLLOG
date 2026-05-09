import { useState } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { useTodosUsuarios, useCrearUsuario, useActualizarUsuario } from '@/hooks/useEmpresas'
import { useAuthStore } from '@/stores/authStore'
import type { Usuario, EstadoUsuario } from '@/types/models'
import type { Rol } from '@/types/roles'
import { Plus, Search, UserX, UserCheck } from 'lucide-react'

type UsuarioRow = Usuario & { empresa?: { id: string; nombre: string; tipo: string } }

const ROL_LABELS: Partial<Record<Rol, string>> = {
  admin: 'Admin', supervisor: 'Supervisor', operador: 'Operador',
}
const ROL_VARIANT: Partial<Record<Rol, 'info' | 'dentro' | 'neutral'>> = {
  admin: 'info', supervisor: 'dentro', operador: 'neutral',
}
const ESTADO_VARIANT: Record<EstadoUsuario, 'activo' | 'inactivo' | 'warning'> = {
  activo: 'activo', inactivo: 'inactivo', suspendido: 'warning',
}

export function GestionUsuarios() {
  const empresaId = useAuthStore((s) => s.empresaId())
  const { data: todos = [], isLoading } = useTodosUsuarios()
  const crear = useCrearUsuario()
  const actualizar = useActualizarUsuario()

  // Admin solo ve usuarios de su empresa, excluye superadmin y auditores
  const usuarios = (todos as UsuarioRow[]).filter(
    (u) => u.empresa_id === empresaId && u.rol !== 'superadmin' && u.rol !== 'auditor'
  )

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<UsuarioRow | null>(null)
  const [form, setForm] = useState({ nombre_completo: '', email: '', rol: 'operador' as Rol, dni: '', telefono: '' })
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  const filtrados = usuarios.filter((u) => {
    const q = search.toLowerCase()
    return u.nombre_completo.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.dni ?? '').includes(q)
  })

  function abrirCrear() {
    setEditando(null)
    setForm({ nombre_completo: '', email: '', rol: 'operador', dni: '', telefono: '' })
    setErrors({}); setModalOpen(true)
  }

  function abrirEditar(u: UsuarioRow) {
    setEditando(u)
    setForm({ nombre_completo: u.nombre_completo, email: u.email, rol: u.rol, dni: u.dni ?? '', telefono: u.telefono ?? '' })
    setErrors({}); setModalOpen(true)
  }

  function validar() {
    const e: typeof errors = {}
    if (!form.nombre_completo.trim()) e.nombre_completo = 'Requerido'
    if (!form.email.trim()) e.email = 'Requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleGuardar() {
    if (!validar()) return
    if (editando) {
      await actualizar.mutateAsync({ id: editando.id, rol: form.rol, nombre_completo: form.nombre_completo, telefono: form.telefono })
    } else {
      await crear.mutateAsync({ empresa_id: empresaId!, ...form })
    }
    setModalOpen(false)
  }

  async function toggleEstado(u: UsuarioRow) {
    await actualizar.mutateAsync({ id: u.id, estado: u.estado === 'activo' ? 'suspendido' : 'activo' })
  }

  return (
    <PageLayout
      title="Usuarios"
      subtitle="Operadores y administradores de tu empresa"
      actions={
        <Button variant="ingreso" size="sm" onClick={abrirCrear}>
          <Plus size={16} className="mr-1.5" /> Invitar usuario
        </Button>
      }
    >
      <div className="relative max-w-xs mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faded)]" />
        <input type="text" placeholder="Buscar por nombre, email o DNI..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15 transition-all"
        />
      </div>

      <Table<UsuarioRow>
        columns={[
          {
            key: 'nombre', header: 'Usuario',
            render: (u) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7F77DD]/15 flex items-center justify-center text-xs font-semibold text-[#534AB7]">
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
            key: 'rol', header: 'Rol',
            render: (u) => <Badge variant={ROL_VARIANT[u.rol] ?? 'neutral'} size="sm">{ROL_LABELS[u.rol] ?? u.rol}</Badge>,
          },
          { key: 'dni', header: 'DNI', render: (u) => <span className="font-mono text-xs text-[var(--text-secondary)]">{u.dni ?? '—'}</span> },
          {
            key: 'estado', header: 'Estado',
            render: (u) => <Badge variant={ESTADO_VARIANT[u.estado]} showDot size="sm">{u.estado.charAt(0).toUpperCase() + u.estado.slice(1)}</Badge>,
          },
          {
            key: 'acciones', header: '', cellClass: 'text-right',
            render: (u) => (
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => abrirEditar(u)} className="px-2.5 py-1 text-xs rounded-lg hover:bg-[#7F77DD]/10 text-[var(--text-secondary)] hover:text-[#534AB7] transition-colors">Editar</button>
                <button onClick={() => toggleEstado(u)} className={`p-1.5 rounded-lg transition-colors ${u.estado === 'activo' ? 'hover:bg-[#E24B4A]/10 text-[var(--text-muted)] hover:text-[#E24B4A]' : 'hover:bg-[#1D9E75]/10 text-[var(--text-muted)] hover:text-[#1D9E75]'}`}>
                  {u.estado === 'activo' ? <UserX size={14} /> : <UserCheck size={14} />}
                </button>
              </div>
            ),
          },
        ]}
        data={filtrados} rowKey={(u) => u.id} isLoading={isLoading} emptyMessage="No hay usuarios en tu empresa"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? `Editar — ${editando.nombre_completo}` : 'Invitar usuario'} size="md">
        {!editando && (
          <div className="bg-[#7F77DD]/8 text-[#534AB7] text-xs px-3 py-2.5 rounded-[10px] mb-4">
            Se enviará una invitación al email ingresado.
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Input label="Nombre completo" value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} error={errors.nombre_completo} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required disabled={!!editando} />
          <Select label="Rol" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
            options={[{ value: 'admin', label: 'Admin' }, { value: 'supervisor', label: 'Supervisor' }, { value: 'operador', label: 'Operador' }]} required />
          <Input label="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} placeholder="Ej: 30123456" />
          <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="ingreso" size="sm" onClick={handleGuardar} loading={crear.isPending || actualizar.isPending}>
            {editando ? 'Guardar cambios' : 'Enviar invitación'}
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
