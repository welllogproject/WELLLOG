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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PermisoAcceso, TipoAcceso } from '@/types/models'
import { Plus, ToggleLeft, ToggleRight, Info, ShieldCheck, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCESO_LABELS: Record<TipoAcceso, string> = {
  lectura: 'Solo lectura', lectura_en_vivo: 'Tiempo real', reporte: 'Solo reportes',
}

const HOY = new Date().toISOString().split('T')[0]

// Hook para crear empresa operadora + usuario auditor en un solo paso
function useInvitarAuditor() {
  const qc = useQueryClient()
  const { usuario } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      empresa_nombre,
      empresa_id_existente,
      auditor_nombre,
      auditor_email,
      equipo_id,
      tipo_acceso,
      puede_ver_incidentes,
      puede_ver_hse,
      puede_ver_coordenadas,
    }: {
      empresa_nombre?: string
      empresa_id_existente?: string
      auditor_nombre: string
      auditor_email: string
      equipo_id?: string
      tipo_acceso: TipoAcceso
      puede_ver_incidentes: boolean
      puede_ver_hse: boolean
      puede_ver_coordenadas: boolean
    }) => {
      if (!usuario) throw new Error('Sin sesión')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sin sesión activa')

      let empresaAuditoraId = empresa_id_existente

      // 1. Si no existe la empresa, crearla
      if (!empresaAuditoraId && empresa_nombre) {
        const { data: nuevaEmpresa, error: empErr } = await supabase
          .from('empresas')
          .insert({
            nombre: empresa_nombre,
            tipo: 'operadora',
            plan: 'free',
            activa: true,
          })
          .select('id')
          .single()
        if (empErr) throw new Error(`Error al crear empresa: ${empErr.message}`)
        empresaAuditoraId = nuevaEmpresa.id
      }

      if (!empresaAuditoraId) throw new Error('Empresa no especificada')

      // 2. Invitar al usuario auditor via Edge Function
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            empresa_id: empresaAuditoraId,
            nombre_completo: auditor_nombre,
            email: auditor_email,
            rol: 'auditor',
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al invitar usuario')

      // 3. Crear el permiso de acceso
      const { error: permErr } = await supabase.from('permisos_acceso').insert({
        empresa_propietaria_id: usuario.empresa_id,
        empresa_auditora_id: empresaAuditoraId,
        equipo_id: equipo_id || null,
        tipo_acceso,
        puede_ver_incidentes,
        puede_ver_hse,
        puede_ver_coordenadas,
        fecha_inicio: HOY,
        activo: true,
      })
      if (permErr) throw new Error(`Error al crear permiso: ${permErr.message}`)

      return { activation_link: data.activation_link, empresaAuditoraId }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['permisos_acceso'] })
      qc.invalidateQueries({ queryKey: ['empresas'] })
      if (data.activation_link) {
        navigator.clipboard.writeText(data.activation_link).catch(() => {})
        toast.success(
          'Auditor invitado. Link de activación copiado al portapapeles — compartilo con el auditor.',
          { duration: 10000 }
        )
      } else {
        toast.success('Auditor invitado — recibirá un email para activar su cuenta')
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function Auditores() {
  const empresaId = useAuthStore((s) => s.empresaId())
  const { data: todosPermisos = [], isLoading } = usePermisosAcceso()
  const { data: operadoras = [] } = useOperadoras()
  const { data: equipos = [] } = useEquipos()
  const toggle = useTogglePermiso()
  const invitar = useInvitarAuditor()

  // Solo permisos donde esta empresa es la propietaria
  const permisos = todosPermisos.filter((p) => p.empresa_propietaria_id === empresaId)

  const [modalOpen, setModalOpen] = useState(false)
  const [modo, setModo] = useState<'existente' | 'nueva'>('existente')
  const [form, setForm] = useState({
    empresa_id_existente: '',
    empresa_nombre_nueva: '',
    auditor_nombre: '',
    auditor_email: '',
    equipo_id: '',
    tipo_acceso: 'lectura_en_vivo' as TipoAcceso,
    puede_ver_incidentes: false,
    puede_ver_hse: false,
    puede_ver_coordenadas: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validar() {
    const e: Record<string, string> = {}
    if (modo === 'existente' && !form.empresa_id_existente) e.empresa = 'Seleccioná una empresa'
    if (modo === 'nueva' && !form.empresa_nombre_nueva.trim()) e.empresa = 'Nombre requerido'
    if (!form.auditor_nombre.trim()) e.nombre = 'Nombre requerido'
    if (!form.auditor_email.trim()) e.email = 'Email requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.auditor_email)) e.email = 'Email inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleInvitar() {
    if (!validar()) return
    await invitar.mutateAsync({
      empresa_id_existente: modo === 'existente' ? form.empresa_id_existente : undefined,
      empresa_nombre: modo === 'nueva' ? form.empresa_nombre_nueva : undefined,
      auditor_nombre: form.auditor_nombre,
      auditor_email: form.auditor_email,
      equipo_id: form.equipo_id || undefined,
      tipo_acceso: form.tipo_acceso,
      puede_ver_incidentes: form.puede_ver_incidentes,
      puede_ver_hse: form.puede_ver_hse,
      puede_ver_coordenadas: form.puede_ver_coordenadas,
    })
    setModalOpen(false)
    setForm({
      empresa_id_existente: '', empresa_nombre_nueva: '', auditor_nombre: '',
      auditor_email: '', equipo_id: '', tipo_acceso: 'lectura_en_vivo',
      puede_ver_incidentes: false, puede_ver_hse: false, puede_ver_coordenadas: false,
    })
  }

  return (
    <PageLayout
      title="Auditores"
      subtitle="Empresas con acceso a tus datos (YPF, TotalEnergies, etc.)"
      actions={
        <Button variant="ingreso" size="sm" onClick={() => { setErrors({}); setModalOpen(true) }}>
          <Plus size={16} className="mr-1.5" /> Invitar auditor
        </Button>
      }
    >
      <div className="bg-[#1D9E75]/8 border border-[#1D9E75]/20 rounded-[12px] p-4 mb-5 flex gap-3">
        <Info size={16} className="text-[#0F6E56] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#0F6E56]">
          Desde acá invitás auditores externos (YPF, TotalEnergies, etc.) para que puedan ver los datos de tus equipos.
          Cada permiso es independiente — podés dar acceso a un equipo específico o a todos.
          El auditor recibe un email con su acceso y solo ve lo que vos autorizás.
        </p>
      </div>

      <Table<PermisoAcceso>
        columns={[
          {
            key: 'auditora', header: 'Empresa auditora',
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
            key: 'activo', header: 'Estado',
            render: (p) => <Badge variant={p.activo ? 'activo' : 'inactivo'} showDot size="sm">{p.activo ? 'Activo' : 'Revocado'}</Badge>,
          },
          {
            key: 'acciones', header: '', cellClass: 'text-right',
            render: (p) => (
              <button onClick={() => toggle.mutate({ id: p.id, activo: !p.activo })}
                className={`p-1.5 rounded-lg transition-colors ${p.activo ? 'hover:bg-[#E24B4A]/10 text-[var(--text-muted)] hover:text-[#E24B4A]' : 'hover:bg-[#1D9E75]/10 text-[var(--text-muted)] hover:text-[#1D9E75]'}`}
                title={p.activo ? 'Revocar acceso' : 'Reactivar'}>
                {p.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
            ),
          },
        ]}
        data={permisos} rowKey={(p) => p.id} isLoading={isLoading} emptyMessage="No hay auditores invitados todavía"
      />

      {/* Modal invitar auditor */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Invitar auditor externo" size="lg">
        <div className="space-y-5">
          {/* Paso 1: Empresa */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-3">1. Empresa del auditor</p>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setModo('existente')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${modo === 'existente' ? 'bg-[#7F77DD]/10 text-[#534AB7]' : 'bg-[var(--hover-bg)] text-[var(--text-secondary)]'}`}
              >
                Empresa existente
              </button>
              <button
                onClick={() => setModo('nueva')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${modo === 'nueva' ? 'bg-[#7F77DD]/10 text-[#534AB7]' : 'bg-[var(--hover-bg)] text-[var(--text-secondary)]'}`}
              >
                Empresa nueva
              </button>
            </div>
            {modo === 'existente' ? (
              <Select
                label="Seleccionar empresa"
                value={form.empresa_id_existente}
                onChange={(e) => setForm({ ...form, empresa_id_existente: e.target.value })}
                options={operadoras.map((e) => ({ value: e.id, label: e.nombre }))}
                placeholder="Elegir empresa..."
                error={errors.empresa}
              />
            ) : (
              <Input
                label="Nombre de la empresa nueva"
                value={form.empresa_nombre_nueva}
                onChange={(e) => setForm({ ...form, empresa_nombre_nueva: e.target.value })}
                placeholder="Ej: YPF, TotalEnergies, Vista Energy..."
                error={errors.empresa}
              />
            )}
          </div>

          {/* Paso 2: Datos del auditor */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <UserPlus size={14} />
              2. Datos del auditor
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nombre completo"
                value={form.auditor_nombre}
                onChange={(e) => setForm({ ...form, auditor_nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                error={errors.nombre}
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.auditor_email}
                onChange={(e) => setForm({ ...form, auditor_email: e.target.value })}
                placeholder="auditor@ypf.com"
                error={errors.email}
                required
              />
            </div>
          </div>

          {/* Paso 3: Permisos */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-3">3. ¿Qué puede ver?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Equipo (vacío = todos)"
                value={form.equipo_id}
                onChange={(e) => setForm({ ...form, equipo_id: e.target.value })}
                options={equipos.map((e) => ({ value: e.id, label: e.nombre_equipo }))}
                placeholder="Todos los equipos"
              />
              <Select
                label="Tipo de acceso"
                value={form.tipo_acceso}
                onChange={(e) => setForm({ ...form, tipo_acceso: e.target.value as TipoAcceso })}
                options={[
                  { value: 'lectura', label: 'Solo lectura' },
                  { value: 'lectura_en_vivo', label: 'Tiempo real' },
                  { value: 'reporte', label: 'Solo reportes' },
                ]}
              />
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {[
                { key: 'puede_ver_incidentes', label: 'Incidentes HSE' },
                { key: 'puede_ver_hse', label: 'Índices HSE' },
                { key: 'puede_ver_coordenadas', label: 'Coordenadas exactas' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(form as any)[key]}
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
          <Button variant="ingreso" size="sm" onClick={handleInvitar} loading={invitar.isPending}>
            Invitar auditor
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
