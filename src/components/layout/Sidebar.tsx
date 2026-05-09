import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Map, ClipboardList, AlertTriangle,
  BarChart3, Users, LogOut, ShieldCheck, FileText,
  Building2, BookOpen, Globe, Lock, Settings, TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { StatusDot } from '@/components/ui/StatusDot'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const SUPERADMIN_ITEMS: NavItem[] = [
  { to: '/superadmin',          label: 'Plataforma',         icon: <Globe size={18} /> },
  { to: '/superadmin/metricas', label: 'Métricas',           icon: <TrendingUp size={18} /> },
  { to: '/superadmin/empresas', label: 'Empresas',           icon: <Building2 size={18} /> },
  { to: '/superadmin/usuarios', label: 'Usuarios',           icon: <Users size={18} /> },
  { to: '/superadmin/permisos', label: 'Permisos de Acceso', icon: <Lock size={18} /> },
  { to: '/superadmin/logs',     label: 'Logs Globales',      icon: <BookOpen size={18} /> },
]

const ADMIN_ITEMS: NavItem[] = [
  { to: '/admin',             label: 'Dashboard',      icon: <LayoutDashboard size={18} /> },
  { to: '/admin/mapa',        label: 'Mapa de Equipos',icon: <Map size={18} /> },
  { to: '/admin/registros',   label: 'Registros',      icon: <ClipboardList size={18} /> },
  { to: '/admin/incidentes',  label: 'Incidentes',     icon: <AlertTriangle size={18} /> },
  { to: '/admin/estadisticas',label: 'Estadísticas',   icon: <BarChart3 size={18} /> },
  { to: '/admin/hse',         label: 'HSE',            icon: <ShieldCheck size={18} /> },
  { to: '/admin/equipos',     label: 'Equipos',        icon: <Settings size={18} /> },
  { to: '/admin/locaciones',  label: 'Locaciones',     icon: <Map size={18} /> },
  { to: '/admin/usuarios',    label: 'Usuarios',       icon: <Users size={18} /> },
  { to: '/admin/auditores',   label: 'Auditores',      icon: <ShieldCheck size={18} /> },
  { to: '/admin/empresas',    label: 'Empresas',       icon: <Building2 size={18} /> },
  { to: '/admin/documentos',  label: 'Documentos',     icon: <FileText size={18} /> },
  { to: '/admin/logs',        label: 'Auditoría',      icon: <BookOpen size={18} /> },
]

const AUDITOR_ITEMS: NavItem[] = [
  { to: '/auditor',            label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/auditor/mapa',       label: 'Mapa',      icon: <Map size={18} /> },
  { to: '/auditor/incidentes', label: 'Incidentes',icon: <AlertTriangle size={18} /> },
  { to: '/auditor/reportes',   label: 'Reportes',  icon: <BarChart3 size={18} /> },
]

const ROL_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  supervisor: 'Supervisor',
  auditor: 'Auditor',
  operador: 'Operador',
}

function WellLogIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wl-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7F77DD" />
          <stop offset="100%" stopColor="#534AB7" />
        </linearGradient>
      </defs>
      <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" fill="url(#wl-grad)" />
      <rect x="15" y="7" width="2" height="12" rx="1" fill="white" opacity="0.95" />
      <path d="M11 17 L16 22 L21 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="13" y="6" width="6" height="2" rx="1" fill="white" opacity="0.7" />
    </svg>
  )
}

export function Sidebar() {
  const { usuario, rol, logout } = useAuth()
  const location = useLocation()

  const items =
    rol === 'superadmin' ? SUPERADMIN_ITEMS
    : rol === 'auditor'  ? AUDITOR_ITEMS
    : ADMIN_ITEMS

  const isActive = (to: string) => {
    const roots = ['/superadmin', '/admin', '/auditor']
    if (roots.includes(to)) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  const accentColor =
    rol === 'superadmin' ? '#534AB7'
    : rol === 'auditor'  ? '#0F6E56'
    : '#534AB7'

  return (
    <aside className="w-60 flex-shrink-0 h-screen bg-[var(--card-bg)] border-r border-[var(--border)] flex flex-col transition-colors duration-200">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <WellLogIcon size={28} />
            <div>
              <span className="font-medium text-[var(--text-primary)] text-sm tracking-tight block">WELL LOG</span>
              {rol === 'superadmin' && (
                <span className="text-[10px] text-[#7F77DD] font-medium">Plataforma</span>
              )}
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={[
                  'flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm transition-all duration-150',
                  isActive(item.to)
                    ? 'font-medium'
                    : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-primary)]',
                ].join(' ')}
                style={
                  isActive(item.to)
                    ? { background: `${accentColor}18`, color: accentColor }
                    : {}
                }
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Usuario */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <div className="relative">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ background: `${accentColor}20`, color: accentColor }}
            >
              {usuario?.nombre_completo.charAt(0).toUpperCase()}
            </div>
            <StatusDot color="green" size="sm" className="absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">{usuario?.nombre_completo}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{ROL_LABELS[rol ?? ''] ?? rol}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-full hover:bg-[#E24B4A]/10 text-[var(--text-muted)] hover:text-[#E24B4A] transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
