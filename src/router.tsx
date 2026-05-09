import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useRequireAuth } from '@/hooks/useAuth'

// Auth
import { LoginView } from '@/views/auth/LoginView'

// Operador
import { OperadorHome } from '@/views/operador/OperadorHome'
import { NuevoIngreso } from '@/views/operador/NuevoIngreso'
import { MarcarSalida } from '@/views/operador/MarcarSalida'
import { ConfigEquipo } from '@/views/operador/ConfigEquipo'

// Admin
import { AdminDashboard } from '@/views/admin/AdminDashboard'
import { Registros } from '@/views/admin/Registros'
import { Incidentes } from '@/views/admin/Incidentes'
import { MapaEquipos } from '@/views/admin/MapaEquipos'
import { EstadisticasHSE } from '@/views/admin/EstadisticasHSE'
import { GestionEquipos } from '@/views/admin/GestionEquipos'
import { GestionLocaciones } from '@/views/admin/GestionLocaciones'
import { GestionUsuarios as AdminGestionUsuarios } from '@/views/admin/GestionUsuarios'
import { Auditores } from '@/views/admin/Auditores'
import { Estadisticas } from '@/views/admin/Estadisticas'
import { Logs } from '@/views/admin/Logs'
import { GestionEmpresas as AdminGestionEmpresas } from '@/views/admin/GestionEmpresas'
import { Documentos } from '@/views/admin/Documentos'

// Auditor
import { AuditorDashboard } from '@/views/auditor/AuditorDashboard'
import { MapaAuditor } from '@/views/auditor/MapaAuditor'
import { IncidentesAuditor } from '@/views/auditor/IncidentesAuditor'
import { ReportesAuditor } from '@/views/auditor/ReportesAuditor'

// Superadmin
import { SuperadminDashboard } from '@/views/superadmin/SuperadminDashboard'
import { GestionEmpresas } from '@/views/superadmin/GestionEmpresas'
import { GestionUsuarios } from '@/views/superadmin/GestionUsuarios'
import { PermisosAcceso } from '@/views/superadmin/PermisosAcceso'
import { MetricasPlataforma } from '@/views/superadmin/MetricasPlataforma'

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
      { path: 'config', element: <ConfigEquipo /> },
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
      { path: 'hse', element: <EstadisticasHSE /> },
      { path: 'equipos', element: <GestionEquipos /> },
      { path: 'locaciones', element: <GestionLocaciones /> },
      { path: 'usuarios', element: <AdminGestionUsuarios /> },
      { path: 'auditores', element: <Auditores /> },
      { path: 'estadisticas', element: <Estadisticas /> },
      { path: 'empresas', element: <AdminGestionEmpresas /> },
      { path: 'documentos', element: <Documentos /> },
      { path: 'logs', element: <Logs /> },
    ],
  },

  // ── AUDITOR (Desktop, solo lectura) ──────────────────
  {
    path: '/auditor',
    element: <AuditorGuard />,
    children: [
      { path: '', element: <AuditorDashboard /> },
      { path: 'mapa', element: <MapaAuditor /> },
      { path: 'incidentes', element: <IncidentesAuditor /> },
      { path: 'reportes', element: <ReportesAuditor /> },
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
      { path: 'metricas', element: <MetricasPlataforma /> },
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
        <h2 className="text-xl font-medium text-[var(--text-primary)]">{title}</h2>
        <p className="text-[var(--text-muted)] mt-2">Módulo en construcción</p>
      </div>
    </PageLayout>
  )
}
