// src/views/superadmin/InventarioTablets.tsx
// CRUD de tablets asignadas a empresas/equipos

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTodasEmpresas } from '@/hooks/useEmpresas'
import { PageLayout } from '@/components/layout/PageLayout'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Plus, Smartphone, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface Tablet {
  id: string
  empresa_id: string | null
  equipo_id: string | null
  numero_serie: string | null
  marca: string | null
  modelo: string | null
  sistema_operativo: string | null
  estado: 'activo' | 'mantenimiento' | 'perdido' | 'retirado'
  asignado_a: string | null
  fecha_asignacion: string | null
  notas: string | null
  created_at: string
  empresa?: { nombre: string } | null
  equipo?: { nombre_equipo: string } | null
  usuario?: { nombre_completo: string } | null
}

function useTablets() {
  return useQuery({
    queryKey: ['inventario-tablets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventario_tablets')
        .select(`
          *,
          empresa:empresas(nombre),
          equipo:equipos(nombre_equipo),
          usuario:usuarios!inventario_tablets_asignado_a_fkey(nombre_completo)
        `)
        .order('created_at', { ascending: false })
      if (error) {
        // Si el join falla, intentar sin joins
        const { data: fallback, error: err2 } = await supabase
          .from('inventario_tablets')
          .select('*')
          .order('created_at', { ascending: false })
        if (err2) throw err2
        return (fallback ?? []) as Tablet[]
      }
      return (data ?? []) as Tablet[]
    },
  })
}

const ESTADO_VARIANT: Record<string, 'activo' | 'warning' | 'danger' | 'inactivo'> = {
  activo: 'activo',
  mantenimiento: 'warning',
  perdido: 'danger',
  retirado: 'inactivo',
}

const EMPTY_FORM = {
  numero_serie: '',
  marca: '',
  modelo: '',
  sistema_operativo: 'Android 15',
  estado: 'activo' as const,
  empresa_id: '',
  equipo_id: '',
  notas: '',
}

export function InventarioTablets() {
  const { data: tablets = [], isLoading } = useTablets()
  const { data: empresas = [] } = useTodasEmpresas()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const crear = useMutation({
    mutationFn: async (f: typeof EMPTY_FORM) => {
      const { error } = await supabase.from('inventario_tablets').insert({
        numero_serie: f.numero_serie || null,
        marca: f.marca || null,
        modelo: f.modelo || null,
        sistema_operativo: f.sistema_operativo || null,
        estado: f.estado,
        empresa_id: f.empresa_id || null,
        equipo_id: f.equipo_id || null,
        notas: f.notas || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario-tablets'] })
      toast.success('Tablet registrada')
      setModalOpen(false)
      setForm(EMPTY_FORM)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const filtradas = tablets.filter((t) => {
    const q = search.toLowerCase()
    return (
      (t.numero_serie ?? '').toLowerCase().includes(q) ||
      (t.marca ?? '').toLowerCase().includes(q) ||
      (t.modelo ?? '').toLowerCase().includes(q) ||
      (t.empresa?.nombre ?? '').toLowerCase().includes(q) ||
      (t.equipo?.nombre_equipo ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <PageLayout
      title="Inventario de Tablets"
      subtitle={`${tablets.length} dispositivo${tablets.length !== 1 ? 's' : ''} registrado${tablets.length !== 1 ? 's' : ''}`}
      actions={
        <Button variant="ingreso" size="sm" onClick={() => { setForm(EMPTY_FORM); setModalOpen(true) }}>
          <Plus size={16} className="mr-1.5" /> Registrar tablet
        </Button>
      }
    >
      <div className="relative max-w-xs mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faded)]" />
        <input type="text" placeholder="Buscar por serie, marca, empresa..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] transition-all"
        />
      </div>

      <Table<Tablet>
        columns={[
          {
            key: 'dispositivo', header: 'Dispositivo',
            render: (t) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#7F77DD]/10 flex items-center justify-center">
                  <Smartphone size={14} className="text-[#534AB7]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{t.marca ?? '—'} {t.modelo ?? ''}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">{t.numero_serie ?? 'Sin S/N'}</p>
                </div>
              </div>
            ),
          },
          { key: 'empresa', header: 'Empresa', render: (t) => <span className="text-sm text-[var(--text-secondary)]">{t.empresa?.nombre ?? '—'}</span> },
          { key: 'equipo', header: 'Equipo', render: (t) => <span className="text-sm text-[var(--text-secondary)]">{t.equipo?.nombre_equipo ?? '—'}</span> },
          { key: 'os', header: 'SO', render: (t) => <span className="text-xs text-[var(--text-muted)]">{t.sistema_operativo ?? '—'}</span> },
          {
            key: 'estado', header: 'Estado',
            render: (t) => <Badge variant={ESTADO_VARIANT[t.estado]} showDot size="sm">{t.estado === 'activo' ? 'Activo' : t.estado === 'mantenimiento' ? 'Mant.' : t.estado === 'perdido' ? 'Perdido' : 'Retirado'}</Badge>,
          },
          { key: 'notas', header: 'Notas', render: (t) => <span className="text-xs text-[var(--text-muted)] truncate max-w-[150px] block">{t.notas ?? '—'}</span> },
        ]}
        data={filtradas}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        emptyMessage="No hay tablets registradas"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar tablet" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Número de serie" value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} placeholder="Ej: CT65-2024-001" />
          <Input label="Marca" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="Ej: Cubot" />
          <Input label="Modelo" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} placeholder="Ej: Tab 65" />
          <Input label="Sistema operativo" value={form.sistema_operativo} onChange={(e) => setForm({ ...form, sistema_operativo: e.target.value })} placeholder="Ej: Android 15" />
          <Select label="Empresa asignada" value={form.empresa_id} onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
            options={empresas.map((emp) => ({ value: emp.id, label: emp.nombre }))} placeholder="Sin asignar" />
          <Select label="Estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
            options={[
              { value: 'activo', label: 'Activo' },
              { value: 'mantenimiento', label: 'En mantenimiento' },
              { value: 'perdido', label: 'Perdido' },
              { value: 'retirado', label: 'Retirado' },
            ]} />
          <div className="sm:col-span-2">
            <Input label="Notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="ingreso" size="sm" onClick={() => crear.mutate(form)} loading={crear.isPending}>Registrar</Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
