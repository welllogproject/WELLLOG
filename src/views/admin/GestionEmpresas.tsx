import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { PageLayout } from '@/components/layout/PageLayout'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Building2, Plus, Search } from 'lucide-react'

interface EmpresaVisitante {
  id: string
  nombre: string
  cuit?: string
  email_contacto?: string
  telefono?: string
  activa: boolean
  created_at: string
}

function useEmpresasVisitantes() {
  const empresaId = useAuthStore((s) => s.empresaId())
  return useQuery({
    queryKey: ['empresas-visitantes', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nombre, cuit, email_contacto, telefono, activa, created_at')
        .eq('tipo', 'contratista')
        .order('nombre')
      if (error) throw error
      return (data ?? []) as EmpresaVisitante[]
    },
  })
}

function useCrearEmpresaVisitante() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (form: Partial<EmpresaVisitante>) => {
      const { error } = await supabase.from('empresas').insert({ ...form, tipo: 'contratista', plan: 'free' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['empresas-visitantes'] }),
  })
}

function useToggleEmpresaVisitante() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, activa }: { id: string; activa: boolean }) => {
      const { error } = await supabase.from('empresas').update({ activa }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['empresas-visitantes'] }),
  })
}

const EMPTY = { nombre: '', cuit: '', email_contacto: '', telefono: '' }

export function GestionEmpresas() {
  const { data: empresas = [], isLoading } = useEmpresasVisitantes()
  const crear = useCrearEmpresaVisitante()
  const toggle = useToggleEmpresaVisitante()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Partial<typeof EMPTY>>({})

  const filtradas = empresas.filter((e) =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (e.cuit ?? '').includes(search)
  )

  function validar() {
    const e: typeof errors = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleGuardar() {
    if (!validar()) return
    await crear.mutateAsync({ ...form, activa: true })
    setModalOpen(false)
    setForm(EMPTY)
  }

  return (
    <PageLayout
      title="Empresas Visitantes"
      subtitle="Empresas habituales que visitan tus equipos"
      actions={
        <Button variant="ingreso" size="sm" onClick={() => { setErrors({}); setForm(EMPTY); setModalOpen(true) }}>
          <Plus size={16} className="mr-1.5" /> Nueva empresa
        </Button>
      }
    >
      <div className="relative max-w-xs mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAAAAA]" />
        <input type="text" placeholder="Buscar por nombre o CUIT..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-clay-sm outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#7F77DD]/15 transition-all"
        />
      </div>

      <Table<EmpresaVisitante>
        columns={[
          {
            key: 'nombre', header: 'Empresa',
            render: (e) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#7F77DD]/10 flex items-center justify-center">
                  <Building2 size={14} className="text-[#534AB7]" />
                </div>
                <span className="font-medium text-[#2C2C2A]">{e.nombre}</span>
              </div>
            ),
          },
          { key: 'cuit', header: 'CUIT', render: (e) => <span className="font-mono text-xs text-[#5F5E5A]">{e.cuit ?? '—'}</span> },
          { key: 'email', header: 'Email', render: (e) => <span className="text-xs text-[#5F5E5A]">{e.email_contacto ?? '—'}</span> },
          { key: 'telefono', header: 'Teléfono', render: (e) => <span className="text-xs text-[#5F5E5A]">{e.telefono ?? '—'}</span> },
          {
            key: 'estado', header: 'Estado',
            render: (e) => <Badge variant={e.activa ? 'activo' : 'inactivo'} showDot size="sm">{e.activa ? 'Activa' : 'Inactiva'}</Badge>,
          },
          {
            key: 'acciones', header: '', cellClass: 'text-right',
            render: (e) => (
              <button onClick={() => toggle.mutate({ id: e.id, activa: !e.activa })}
                className="px-2.5 py-1 text-xs rounded-lg hover:bg-[#7F77DD]/10 text-[#5F5E5A] hover:text-[#534AB7] transition-colors">
                {e.activa ? 'Desactivar' : 'Activar'}
              </button>
            ),
          },
        ]}
        data={filtradas} rowKey={(e) => e.id} isLoading={isLoading} emptyMessage="No hay empresas visitantes registradas"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva empresa visitante" size="md">
        <div className="flex flex-col gap-4">
          <Input label="Nombre de la empresa" value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            error={errors.nombre} required placeholder="Ej: Halliburton Argentina" />
          <Input label="CUIT" value={form.cuit ?? ''}
            onChange={(e) => setForm({ ...form, cuit: e.target.value })}
            placeholder="Ej: 30123456789" />
          <Input label="Email de contacto" type="email" value={form.email_contacto ?? ''}
            onChange={(e) => setForm({ ...form, email_contacto: e.target.value })} />
          <Input label="Teléfono" value={form.telefono ?? ''}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="ingreso" size="sm" onClick={handleGuardar} loading={crear.isPending}>Guardar</Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
