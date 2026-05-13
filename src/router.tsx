import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useRequireAuth } from '@/hooks/useAuth'

// Auth — se carga siempre (es la primera pantalla)
import { LoginView } from '@/views/auth/LoginView'
import { RecoverPasswordView } from '@/views/auth/RecoverPasswordView'

// ── Lazy imports ────────────────────────────────────────

// Operador
const OperadorHome = lazy(() => import('@/views/operador/OperadorHome').then(m => ({ default: m.OperadorHome })))
const NuevoIngreso = lazy(() => import('@/views/operador/NuevoIngreso').then(m => ({ default: m.NuevoIngreso })))
const MarcarSalida = lazy(() => import('@/views/operador/MarcarSalida').then(m => ({ default: m.MarcarSalida })))
const ConfigEquipo = lazy(() => import('@/views/operador/ConfigEquipo').then(m => ({ default: m.ConfigEquipo })))

// Admin
const AdminDashboard = lazy(() => import('@/views/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const Registros = lazy(() => import('@/views/admin/Registros').then(m => ({ default: m.Registros })))
const Incidentes = lazy(() => import('@/views/admin/Incidentes').then(m => ({ default: m.Incidentes })))
const MapaEquipos = lazy(() => import('@/views/admin/MapaEquipos').then(m => ({ default: m.MapaEquipos })))
const EstadisticasHSE = lazy(() => import('@/views/admin/EstadisticasHSE').then(m => ({ default: m.EstadisticasHSE })))
const GestionEquipos = lazy(() => import('@/views/admin/GestionEquipos').then(m => ({ default: m.GestionEquipos })))
const GestionLocaciones = lazy(() => import('@/views/admin/GestionLocaciones').then(m => ({ default: m.GestionLocaciones })))
const AdminGestionUsuarios = lazy(() => import('@/views/admin/GestionUsuarios').then(m => ({ default: m.GestionUsuarios })))
const Auditores = lazy(() => import('@/views/admin/Auditores').then(m => ({ default: m.Auditores })))
const Estadisticas = lazy(() => import('@/views/admin/Estadisticas').then(m => ({ default: m.Estadisticas })))
const Logs = lazy(() => import('@/views/admin/Logs').then(m => ({ default: m.Logs })))
const AdminGestionEmpresas = lazy(() => import('@/views/admin/GestionEmpresas').then(m => ({ default: m.GestionEmpresas })))
const Documentos = lazy(() => import('@/views/admin/Documentos').then(m => ({ default: m.Documentos })))

// Auditor
const AuditorDashboard = lazy(() => import('@/views/auditor/AuditorDashboard').then(m => ({ default: m.AuditorDashboard })))
const MapaAuditor = lazy(() => import('@/views/auditor/MapaAuditor').then(m => ({ default: m.MapaAuditor })))
const IncidentesAuditor = lazy(() => import('@/views/auditor/IncidentesAuditor').then(m => ({ default: m.IncidentesAuditor })))
const ReportesAuditor = lazy(() => import('@/views/auditor/ReportesAuditor').then(m => ({ default: m.ReportesAuditor })))

// Superadmin
const SuperadminDashboard = lazy(() => import('@/views/superadmin/SuperadminDashboard').then(m => ({ default: m.SuperadminDashboard })))
const GestionEmpresas = lazy(() => import('@/views/superadmin/GestionEmpresas').then(m => ({ default: m.GestionEmpresas })))
const GestionUsuarios = lazy(() => import('@/views/superadmin/GestionUsuarios').then(m => ({ default: m.GestionUsuarios })))
const PermisosAcceso = lazy(() => import('@/views/superadmin/PermisosAcceso').then(m => ({ default: m.PermisosAcceso })))
const MetricasPlataforma = lazy(() => import('@/views/superadmin/MetricasPlataforma').then(m => ({ default: m.MetricasPlataforma })))
const ConfiguracionPlataforma = lazy(() => import('@/views/superadmin/ConfiguracionPlataforma').then(m => ({ default: m.ConfiguracionPlataforma })))
const SoportePlataforma = lazy(() => import('@/views/superadmin/SoportePlataforma').then(m => ({ default: m.SoportePlataforma })))
const LogsGlobales = lazy(() => import('@/views/superadmin/LogsGlobales').then(m => ({ default: m.LogsGlobales })))

// ── Suspense fallback ───────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-[#7F77DD]/20 flex items-center justify-center animate-pulse">
          <span className="text-[#534AB7] text-xs font-semibold">WL</span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Cargando...</p>
      </div>
    </div>
  )
}

function SuspenseWrapper() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  )
}

// ── Guards ──────────────────────────────────────────────

function OperadorGuard() {
  useRequireAuth(['operador', 'admin', 'superadmin'])
  return <SuspenseWrapper />
}

function AdminGuard() {
  useRequireAuth(['admin', 'superadmin'])
  return <SuspenseWrapper />
}

function AuditorGuard() {
  useRequireAuth(['auditor', 'admin', 'superadmin'])
  return <SuspenseWrapper />
}

function SuperadminGuard() {
  useRequireAuth(['superadmin'])
  return <SuspenseWrapper />
}

// ── Router ──────────────────────────────────────────────

export const router = createBrowserRouter([
  { path: '/login', element: <LoginView /> },
  { path: '/recover', element: <RecoverPasswordView /> },
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
      { path: 'config', element: <ConfiguracionPlataforma /> },
      { path: 'soporte', element: <SoportePlataforma /> },
      { path: 'logs', element: <LogsGlobales /> },
    ],
  },

  { path: '*', element: <Navigate to="/login" replace /> },
])
