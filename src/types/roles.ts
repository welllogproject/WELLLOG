// src/types/roles.ts
// Roles y permisos del sistema FieldPass

export type Rol = 'superadmin' | 'admin' | 'operador' | 'auditor' | 'supervisor'

export type PrecisionMapa = 'exacta' | 'degradada' | null

export interface PermisosRol {
  ver_todos_los_datos: boolean
  editar_registros: boolean
  editar_registros_historicos: boolean
  eliminar_logico: boolean
  ver_mapa: boolean
  exportar_coordenadas: boolean
  ver_firmas: boolean
  gestionar_empresas: boolean
  gestionar_usuarios: boolean
  crear_auditores: boolean
  ver_incidentes: boolean
  cerrar_incidentes: boolean
  ver_logs: boolean
  precision_mapa: PrecisionMapa
}

export const PERMISOS: Record<Rol, PermisosRol> = {
  superadmin: {
    ver_todos_los_datos: true,
    editar_registros: true,
    editar_registros_historicos: true,
    eliminar_logico: true,
    ver_mapa: true,
    exportar_coordenadas: true,
    ver_firmas: true,
    gestionar_empresas: true,
    gestionar_usuarios: true,
    crear_auditores: true,
    ver_incidentes: true,
    cerrar_incidentes: true,
    ver_logs: true,
    precision_mapa: 'exacta',
  },
  admin: {
    ver_todos_los_datos: true,
    editar_registros: true,
    editar_registros_historicos: true,
    eliminar_logico: true,
    ver_mapa: true,
    exportar_coordenadas: true,
    ver_firmas: true,
    gestionar_empresas: false,
    gestionar_usuarios: true,
    crear_auditores: true,
    ver_incidentes: true,
    cerrar_incidentes: true,
    ver_logs: true,
    precision_mapa: 'exacta',
  },
  operador: {
    ver_todos_los_datos: false,
    editar_registros: true,
    editar_registros_historicos: false,
    eliminar_logico: false,
    ver_mapa: false,
    exportar_coordenadas: false,
    ver_firmas: true,
    gestionar_empresas: false,
    gestionar_usuarios: false,
    crear_auditores: false,
    ver_incidentes: true,
    cerrar_incidentes: false,
    ver_logs: false,
    precision_mapa: null,
  },
  auditor: {
    ver_todos_los_datos: false,
    editar_registros: false,
    editar_registros_historicos: false,
    eliminar_logico: false,
    ver_mapa: true,
    exportar_coordenadas: false,
    ver_firmas: false,
    gestionar_empresas: false,
    gestionar_usuarios: false,
    crear_auditores: false,
    ver_incidentes: false,
    cerrar_incidentes: false,
    ver_logs: false,
    precision_mapa: 'degradada',
  },
  supervisor: {
    ver_todos_los_datos: true,
    editar_registros: true,
    editar_registros_historicos: false,
    eliminar_logico: false,
    ver_mapa: true,
    exportar_coordenadas: false,
    ver_firmas: true,
    gestionar_empresas: false,
    gestionar_usuarios: false,
    crear_auditores: false,
    ver_incidentes: true,
    cerrar_incidentes: false,
    ver_logs: false,
    precision_mapa: 'exacta',
  },
} as const

export const ROL_LABELS: Record<Rol, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  operador: 'Operador',
  auditor: 'Auditor',
  supervisor: 'Supervisor',
}

export const MOTIVOS_VISITA = [
  'Trabajo en Pozo',
  'Inspección de Seguridad',
  'Mantenimiento de Equipo',
  'Supervisión de Operaciones',
  'Entrega de Materiales',
  'Auditoría HSE',
  'Capacitación',
  'Visita Médica',
  'Emergencia',
  'Otro',
] as const

export type MotivoVisita = typeof MOTIVOS_VISITA[number]
