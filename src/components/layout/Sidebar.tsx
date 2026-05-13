import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Map, ClipboardList, AlertTriangle,
  BarChart3, Users, LogOut, ShieldCheck, FileText,
  Building2, BookOpen, Globe, Lock, Settings, TrendingUp,
  HelpCircle, X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { StatusDot } from '@/components/ui/StatusDot'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Logo } from '@/components/ui/Logo'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const SUPERADMIN_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/superadmin',            label: 'Plataforma',         icon: <Globe size={16} /> },
      { to: '/superadmin/metricas',   label: 'Métricas',           icon: <TrendingUp size={16} /> },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/superadmin/empresas',   label: 'Empresas',           icon: <Building2 size={16} /> },
      { to: '/superadmin/usuarios',   label: 'Usuarios',           icon: <Users size={16} /> },
      { to: '/superadmin/permisos',   label: 'Permisos de Acceso', icon: <Lock size={16} /> },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/superadmin/dispositivos', label: 'Mapa Tablets',     icon: <Globe size={16} /> },
      { to: '/superadmin/tablets',    label: 'Inventario',         icon: <Settings size={16} /> },
      { to: '/superadmin/sesiones',   label: 'Sesiones',           icon: <Lock size={16} /> },
      { to: '/superadmin/config',     label: 'Configuración',      icon: <Settings size={16} /> },
      { to: '/superadmin/soporte',    label: 'Soporte',            icon: <HelpCircle size={16} /> },
      { to: '/superadmin/logs',       label: 'Logs Globales',      icon: <BookOpen size={16} /> },
    ],
  },
]

const ADMIN_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/admin',             label: 'Dashboard',       icon: <LayoutDashboard size={16} /> },
      { to: '/admin/mapa',        label: 'Mapa de Equipos', icon: <Map size={16} /> },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/admin/registros',   label: 'Registros',       icon: <ClipboardList size={16} /> },
      { to: '/admin/incidentes',  label: 'Incidentes',      icon: <AlertTriangle size={16} /> },
      { to: '/admin/estadisticas',label: 'Estadísticas',    icon: <BarChart3 size={16} /> },
      { to: '/admin/hse',         label: 'HSE',             icon: <ShieldCheck size={16} /> },
    ],
  },
  {
    label: 'Configuración',
    items: [
      { to: '/admin/equipos',     label: 'Equipos',         icon: <Settings size={16} /> },
      { to: '/admin/locaciones',  label: 'Locaciones',      icon: <Map size={16} /> },
      { to: '/admin/usuarios',    label: 'Usuarios',        icon: <Users size={16} /> },
      { to: '/admin/auditores',   label: 'Auditores',       icon: <ShieldCheck size={16} /> },
      { to: '/admin/empresas',    label: 'Empresas',        icon: <Building2 size={16} /> },
      { to: '/admin/documentos',  label: 'Documentos',      icon: <FileText size={16} /> },
      { to: '/admin/logs',        label: 'Auditoría',       icon: <BookOpen size={16} /> },
    ],
  },
]

const AUDITOR_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/auditor',            label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
      { to: '/auditor/mapa',       label: 'Mapa',      icon: <Map size={16} /> },
      { to: '/auditor/incidentes', label: 'Incidentes',icon: <AlertTriangle size={16} /> },
      { to: '/auditor/reportes',   label: 'Reportes',  icon: <BarChart3 size={16} /> },
    ],
  },
]

const ROL_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  supervisor: 'Supervisor',
  auditor: 'Auditor',
  operador: 'Operador',
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { usuario, rol, logout } = useAuth()
  const location = useLocation()

  const groups =
    rol === 'superadmin' ? SUPERADMIN_GROUPS
    : rol === 'auditor'  ? AUDITOR_GROUPS
    : ADMIN_GROUPS

  const isActive = (to: string) => {
    const roots = ['/superadmin', '/admin', '/auditor']
    if (roots.includes(to)) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  const accentColor =
    rol === 'superadmin' ? '#534AB7'
    : rol === 'auditor'  ? '#0F6E56'
    : '#534AB7'

  const handleNavClick = () => {
    // En móvil, cerrar el sidebar al navegar
    if (window.innerWidth < 1024) onClose()
  }

  return (
    <>
      {/* Backdrop móvil */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          // Desktop: siempre visible, fijo
          'lg:relative lg:translate-x-0 lg:flex',
          // Móvil: drawer desde la izquierda
          'fixed inset-y-0 left-0 z-40 lg:z-auto',
          'w-64 lg:w-56 flex-shrink-0 h-screen',
          'bg-[var(--card-bg)] border-r border-[var(--border)]',
          'flex flex-col transition-all duration-300 ease-in-out',
          open ? 'translate-x-0 shadow-clay-lg' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="px-4 py-3.5 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Logo size={26} />
              <div>
                <span className="font-semibold text-[var(--text-primary)] text-sm tracking-tight block leading-tight">
                  WELL LOG
                </span>
                {rol === 'superadmin' && (
                  <span className="text-[10px] text-[#7F77DD] font-medium">Plataforma</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              {/* Botón cerrar — solo en móvil */}
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)]"
                aria-label="Cerrar menú"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-1 pt-1 border-t border-[var(--divider)]' : ''}>
              {group.label && (
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faded)]">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.to)
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={handleNavClick}
                        className={[
                          'flex items-center gap-2.5 px-3 py-2.5 lg:py-2 rounded-[9px] text-sm transition-all duration-100',
                          active
                            ? 'font-medium'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]',
                        ].join(' ')}
                        style={active ? { background: `${accentColor}14`, color: accentColor } : {}}
                      >
                        <span className={active ? '' : 'opacity-60'}>
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Usuario */}
        <div className="p-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] hover:bg-[var(--hover-bg)] transition-colors">
            <div className="relative flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: `${accentColor}18`, color: accentColor }}
              >
                {usuario?.nombre_completo.charAt(0).toUpperCase()}
              </div>
              <StatusDot color="green" size="sm" className="absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">
                {usuario?.nombre_completo}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                {ROL_LABELS[rol ?? ''] ?? rol}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-[#E24B4A]/10 text-[var(--text-muted)] hover:text-[#E24B4A] transition-colors flex-shrink-0"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
