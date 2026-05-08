import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Map, ClipboardList, AlertTriangle,
  BarChart3, Users, LogOut, ShieldCheck, FileText,
  Building2, BookOpen, Globe, Lock, Settings, TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { StatusDot } from '@/components/ui/StatusDot'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const SUPERADMIN_ITEMS: NavItem[] = [
  { to: '/superadmin',          label: 'Plataforma',       icon: <Globe size={18} /> },
  { to: '/superadmin/metricas', label: 'Métricas',         icon: <TrendingUp size={18} /> },
  { to: '/superadmin/empresas', label: 'Empresas',         icon: <Building2 size={18} /> },
  { to: '/superadmin/usuarios', label: 'Usuarios',         icon: <Users size={18} /> },
  { to: '/superadmin/permisos', label: 'Permisos de Acceso', icon: <Lock size={18} /> },
  { to: '/superadmin/logs',     label: 'Logs Globales',    icon: <BookOpen size={18} /> },
]

const ADMIN_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/mapa', label: 'Mapa de Equipos', icon: <Map size={18} /> },
  { to: '/admin/registros', label: 'Registros', icon: <ClipboardList size={18} /> },
  { to: '/admin/incidentes', label: 'Incidentes', icon: <AlertTriangle size={18} /> },
  { to: '/admin/estadisticas', label: 'Estadísticas', icon: <BarChart3 size={18} /> },
  { to: '/admin/hse', label: 'HSE', icon: <ShieldCheck size={18} /> },
  { to: '/admin/equipos', label: 'Equipos', icon: <Settings size={18} /> },
  { to: '/admin/usuarios', label: 'Usuarios', icon: <Users size={18} /> },
  { to: '/admin/empresas', label: 'Empresas', icon: <Building2 size={18} /> },
  { to: '/admin/documentos', label: 'Documentos', icon: <FileText size={18} /> },
  { to: '/admin/logs', label: 'Auditoría', icon: <BookOpen size={18} /> },
]

const AUDITOR_ITEMS: NavItem[] = [
  { to: '/auditor', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/auditor/mapa', label: 'Mapa', icon: <Map size={18} /> },
  { to: '/auditor/incidentes', label: 'Incidentes', icon: <AlertTriangle size={18} /> },
  { to: '/auditor/reportes', label: 'Reportes', icon: <BarChart3 size={18} /> },
]

const ROL_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  supervisor: 'Supervisor',
  auditor: 'Auditor',
  operador: 'Operador',
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
    <aside className="w-60 flex-shrink-0 h-screen bg-white border-r border-[rgba(0,0,0,0.07)] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--btn-ingreso)' }}
          >
            <span className="text-white text-xs font-semibold">WL</span>
          </div>
          <div>
            <span className="font-medium text-[#2C2C2A] text-sm tracking-tight block">WELL LOG</span>
            {rol === 'superadmin' && (
              <span className="text-[10px] text-[#7F77DD] font-medium">Plataforma</span>
            )}
          </div>
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
                    : 'text-[#5F5E5A] hover:bg-black/5 hover:text-[#2C2C2A]',
                ].join(' ')}
                style={
                  isActive(item.to)
                    ? { background: `${accentColor}14`, color: accentColor }
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
      <div className="p-3 border-t border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-black/5 transition-colors">
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
            <p className="text-xs font-medium text-[#2C2C2A] truncate">{usuario?.nombre_completo}</p>
            <p className="text-[10px] text-[#888780]">{ROL_LABELS[rol ?? ''] ?? rol}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-full hover:bg-[#E24B4A]/10 text-[#888780] hover:text-[#E24B4A] transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
