import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useRequireAuth } from '@/hooks/useAuth'

// Auth
import { LoginView } from '@/views/auth/LoginView'

// Operador
import { OperadorHome } from '@/views/operador/OperadorHome'
import { NuevoIngreso } from '@/views/operador/NuevoIngreso'
import { MarcarSalida } from '@/views/operador/MarcarSalida'

// Admin
import { AdminDashboard } from '@/views/admin/AdminDashboard'
import { Registros } from '@/views/admin/Registros'
import { Incidentes } from '@/views/admin/Incidentes'
import { MapaEquipos } from '@/views/admin/MapaEquipos'
import { EstadisticasHSE } from '@/views/admin/EstadisticasHSE'

// Superadmin
import { SuperadminDashboard } from '@/views/superadmin/SuperadminDashboard'
import { GestionEmpresas } from '@/views/superadmin/GestionEmpresas'
import { GestionUsuarios } from '@/views/superadmin/GestionUsuarios'
import { PermisosAcceso } from '@/views/superadmin/PermisosAcceso'

// Guards
function OperadorGuard() {
  useRequireAuth(['operador', 'admin', 'superadmin'])
  return <Outlet />
}

function AdminGuard() {
  useRequireAuth(['admin', 'superadmin'])
  return <Outlet />
}

function AuditorGuard() {
  useRequireAuth(['auditor', 'admin', 'superadmin'])
  return <Outlet />
}

function SuperadminGuard() {
  useRequireAuth(['superadmin'])
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginView /> },
  { path: '/', element: <Navigate to="/login" replace /> },

  // ── OPERADOR (Mobile/Tablet) ──────────────────────────
  {
    path: '/operador',
    element: <OperadorGuard />,
    children: [
      { path: '', element: <OperadorHome /> },
      { path: 'ingreso', element: <NuevoIngreso /> },
      { path: 'salida', element: <MarcarSalida /> },
    ],
  },

  // ── ADMIN (Desktop) ───────────────────────────────────
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      { path: '', element: <AdminDashboard /> },
      { path: 'registros', element: <Registros /> },
      { path: 'incidentes', element: <Incidentes /> },
      { path: 'mapa', element: <MapaEquipos /> },
      { path: 'estadisticas', element: <EstadisticasHSE /> },
      { path: 'hse', element: <EstadisticasHSE /> },
      { path: 'equipos', element: <PagePlaceholder title="Gestión de Equipos" /> },
      { path: 'usuarios', element: <PagePlaceholder title="Gestión de Usuarios" /> },
      { path: 'empresas', element: <PagePlaceholder title="Gestión de Empresas" /> },
      { path: 'documentos', element: <PagePlaceholder title="Documentos de Seguridad" /> },
      { path: 'logs', element: <PagePlaceholder title="Logs de Auditoría" /> },
    ],
  },

  // ── AUDITOR (Desktop, solo lectura) ──────────────────
  {
    path: '/auditor',
    element: <AuditorGuard />,
    children: [
      { path: '', element: <PagePlaceholder title="Dashboard Auditor" /> },
      { path: 'mapa', element: <MapaEquipos /> },
      { path: 'incidentes', element: <Incidentes /> },
      { path: 'reportes', element: <EstadisticasHSE /> },
    ],
  },

  // ── SUPERADMIN (Plataforma completa) ──────────────────
  {
    path: '/superadmin',
    element: <SuperadminGuard />,
    children: [
      { path: '', element: <SuperadminDashboard /> },
      { path: 'empresas', element: <GestionEmpresas /> },
      { path: 'usuarios', element: <GestionUsuarios /> },
      { path: 'permisos', element: <PermisosAcceso /> },
      { path: 'logs', element: <PagePlaceholder title="Logs Globales" /> },
    ],
  },

  { path: '*', element: <Navigate to="/login" replace /> },
])

import { PageLayout } from '@/components/layout/PageLayout'

function PagePlaceholder({ title }: { title: string }) {
  return (
    <PageLayout title={title}>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1D9E75]/10 flex items-center justify-center mb-4 text-2xl">
          🚧
        </div>
        <h2 className="text-xl font-medium text-[#2C2C2A]">{title}</h2>
        <p className="text-[#888780] mt-2">Módulo en construcción</p>
      </div>
    </PageLayout>
  )
}
