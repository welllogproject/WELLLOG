import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PageLayout } from '@/components/layout/PageLayout'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/authStore'
import { Plus, Search, AlertTriangle, FileText } from 'lucide-react'

const TIPO_LABELS: Record<string, string> = {
  ATS: 'ATS', Induccion: 'Inducción', Permiso_Trabajo: 'Permiso de trabajo',
  Certificacion_ART: 'Certificación ART', Habilitacion: 'Habilitación', Otro: 'Otro',
}

const HOY = new Date().toISOString().split('T')[0]

function diasParaVencer(fecha: string): number {
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000)
}

function useDocumentos() {
  const empresaId = useAuthStore((s) => s.empresaId())
  return useQuery({
    queryKey: ['documentos', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos_seguridad')
        .select('*')
        .eq('empresa_id', empresaId!)
        .order('fecha_vencimiento', { ascending: true })
      if (error) throw error
      return (data ?? []) as any[]
    },
  })
}

function useCrearDocumento() {
  const qc = useQueryClient()
  const empresaId = useAuthStore((s) => s.empresaId())
  return useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from('documentos_seguridad').insert({ ...form, empresa_id: empresaId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos'] }),
  })
}

function useEliminarDocumento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documentos_seguridad').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos'] }),
  })
}

const EMPTY_FORM = {
  dni_titular: '', nombre_titular: '', tipo: 'ATS',
  nombre_documento: '', numero_documento: '',
  fecha_emision: '', fecha_vencimiento: '',
  nivel_alerta: 'warning', bloqueante: false,
}

export function Documentos() {
  const { data: documentos = [], isLoading } = useDocumentos()
  const crear = useCrearDocumento()
  const eliminar = useEliminarDocumento()

  const [search, setSearch] = useState('')
  const [filterAlerta, setFilterAlerta] = useState<'todos' | 'vencidos' | 'proximos' | 'vigentes'>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({})

  const filtrados = documentos.filter((d) => {
    const q = search.toLowerCase()
    const matchSearch = (d.dni_titular ?? '').includes(q) ||
      (d.nombre_titular ?? '').toLowerCase().includes(q) ||
      (d.nombre_documento ?? '').toLowerCase().includes(q)

    if (!matchSearch) return false
    if (filterAlerta === 'todos') return true

    if (!d.fecha_vencimiento) return filterAlerta === 'vigentes'
    const dias = diasParaVencer(d.fecha_vencimiento)
    if (filterAlerta === 'vencidos') return dias < 0
    if (filterAlerta === 'proximos') return dias >= 0 && dias <= 30
    if (filterAlerta === 'vigentes') return dias > 30
    return true
  })

  const vencidos = documentos.filter((d) => d.fecha_vencimiento && diasParaVencer(d.fecha_vencimiento) < 0).length
  const proximos = documentos.filter((d) => d.fecha_vencimiento && diasParaVencer(d.fecha_vencimiento) >= 0 && diasParaVencer(d.fecha_vencimiento) <= 30).length

  function validar() {
    const e: Partial<typeof EMPTY_FORM> = {}
    if (!form.dni_titular.trim()) e.dni_titular = 'Requerido'
    if (!form.tipo) e.tipo = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleGuardar() {
    if (!validar()) return
    await crear.mutateAsync({
      ...form,
      fecha_emision: form.fecha_emision || null,
      fecha_vencimiento: form.fecha_vencimiento || null,
    })
    setModalOpen(false)
    setForm(EMPTY_FORM)
  }

  return (
    <PageLayout
      title="Documentos de Seguridad"
      subtitle="ATS, inducciones, permisos y certificaciones con vencimiento"
      actions={
        <Button variant="ingreso" size="sm" onClick={() => { setErrors({}); setForm(EMPTY_FORM); setModalOpen(true) }}>
          <Plus size={16} className="mr-1.5" /> Cargar documento
        </Button>
      }
    >
      {/* Alertas */}
      {(vencidos > 0 || proximos > 0) && (
        <div className="flex flex-wrap gap-3 mb-5">
          {vencidos > 0 && (
            <div className="flex items-center gap-2 bg-[#E24B4A]/8 border border-[#E24B4A]/20 rounded-[10px] px-4 py-2.5">
              <AlertTriangle size={14} className="text-[#E24B4A]" />
              <span className="text-xs font-medium text-[#b93332]">{vencidos} documento{vencidos > 1 ? 's' : ''} vencido{vencidos > 1 ? 's' : ''}</span>
            </div>
          )}
          {proximos > 0 && (
            <div className="flex items-center gap-2 bg-[#BA7517]/8 border border-[#BA7517]/20 rounded-[10px] px-4 py-2.5">
              <AlertTriangle size={14} className="text-[#BA7517]" />
              <span className="text-xs font-medium text-[#7A4E0F]">{proximos} vence{proximos > 1 ? 'n' : ''} en menos de 30 días</span>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faded)]" />
          <input type="text" placeholder="Buscar por DNI, nombre o documento..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-strong)] rounded-clay-sm outline-none focus:border-[#7F77DD] transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'vencidos', 'proximos', 'vigentes'] as const).map((f) => (
            <button key={f} onClick={() => setFilterAlerta(f)}
              className={`px-3 py-2 text-xs font-medium rounded-[8px] transition-all ${filterAlerta === f ? 'bg-[#7F77DD]/10 text-[#534AB7]' : 'bg-[var(--card-bg)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'}`}>
              {f === 'todos' ? 'Todos' : f === 'vencidos' ? 'Vencidos' : f === 'proximos' ? 'Próximos a vencer' : 'Vigentes'}
            </button>
          ))}
        </div>
      </div>

      <Table
        columns={[
          {
            key: 'titular', header: 'Titular',
            render: (d) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#7F77DD]/10 flex items-center justify-center">
                  <FileText size={14} className="text-[#534AB7]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{d.nombre_titular ?? '—'}</p>
                  <p className="text-xs text-[var(--text-muted)]">DNI {d.dni_titular}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'tipo', header: 'Tipo',
            render: (d) => <Badge variant="info" size="sm">{TIPO_LABELS[d.tipo] ?? d.tipo}</Badge>,
          },
          { key: 'nombre', header: 'Documento', render: (d) => <span className="text-xs text-[var(--text-secondary)]">{d.nombre_documento ?? '—'}</span> },
          {
            key: 'vencimiento', header: 'Vencimiento',
            render: (d) => {
              if (!d.fecha_vencimiento) return <span className="text-xs text-[var(--text-muted)]">Sin vencimiento</span>
              const dias = diasParaVencer(d.fecha_vencimiento)
              const color = dias < 0 ? '#E24B4A' : dias <= 30 ? '#BA7517' : '#1D9E75'
              return (
                <div>
                  <p className="text-xs font-medium" style={{ color }}>{d.fecha_vencimiento}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {dias < 0 ? `Venció hace ${Math.abs(dias)} días` : dias === 0 ? 'Vence hoy' : `${dias} días`}
                  </p>
                </div>
              )
            },
          },
          {
            key: 'alerta', header: 'Alerta',
            render: (d) => (
              <div className="flex flex-col gap-1">
                <Badge variant={d.nivel_alerta === 'danger' ? 'danger' : 'warning'} size="sm">
                  {d.nivel_alerta === 'danger' ? 'Bloqueante' : 'Advertencia'}
                </Badge>
              </div>
            ),
          },
          {
            key: 'acciones', header: '', cellClass: 'text-right',
            render: (d) => (
              <button onClick={() => eliminar.mutate(d.id)}
                className="px-2.5 py-1 text-xs rounded-lg hover:bg-[#E24B4A]/10 text-[var(--text-muted)] hover:text-[#E24B4A] transition-colors">
                Eliminar
              </button>
            ),
          },
        ]}
        data={filtrados} rowKey={(d) => d.id} isLoading={isLoading} emptyMessage="No hay documentos cargados"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Cargar documento de seguridad" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="DNI del titular" value={form.dni_titular}
            onChange={(e) => setForm({ ...form, dni_titular: e.target.value })}
            error={errors.dni_titular} required placeholder="Ej: 30123456" />
          <Input label="Nombre del titular" value={form.nombre_titular}
            onChange={(e) => setForm({ ...form, nombre_titular: e.target.value })} />
          <Select label="Tipo de documento" value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            options={Object.entries(TIPO_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            required />
          <Input label="Nombre del documento" value={form.nombre_documento}
            onChange={(e) => setForm({ ...form, nombre_documento: e.target.value })}
            placeholder="Ej: Inducción SSO 2024" />
          <Input label="Número / Código" value={form.numero_documento}
            onChange={(e) => setForm({ ...form, numero_documento: e.target.value })} />
          <Input label="Fecha de emisión" type="date" value={form.fecha_emision}
            onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })} />
          <Input label="Fecha de vencimiento" type="date" value={form.fecha_vencimiento}
            onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} />
          <Select label="Nivel de alerta" value={form.nivel_alerta}
            onChange={(e) => setForm({ ...form, nivel_alerta: e.target.value })}
            options={[
              { value: 'warning', label: 'Advertencia — permite ingreso' },
              { value: 'danger', label: 'Bloqueante — impide ingreso' },
            ]} />
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.bloqueante}
                onChange={(e) => setForm({ ...form, bloqueante: e.target.checked })}
                className="w-4 h-4 rounded accent-[#E24B4A]" />
              <span className="text-sm text-[var(--text-primary)]">Bloquear ingreso si está vencido</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="ingreso" size="sm" onClick={handleGuardar} loading={crear.isPending}>Guardar documento</Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
