// src/types/models.ts
// Tipos de negocio de FieldPass

import type { Rol } from './roles'

// ──────────────────────────────────────────────────────────
// EMPRESA
// ──────────────────────────────────────────────────────────
export type PlanEmpresa = 'free' | 'pro' | 'enterprise'
export type TipoEmpresa = 'contratista' | 'operadora'

export interface Empresa {
  id: string
  nombre: string
  tipo: TipoEmpresa
  razon_social?: string
  cuit?: string
  email_contacto?: string
  telefono?: string
  plan: PlanEmpresa
  activa: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

// ──────────────────────────────────────────────────────────
// USUARIO
// ──────────────────────────────────────────────────────────
export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido'

export interface Usuario {
  id: string
  empresa_id: string
  email: string
  nombre_completo: string
  rol: Rol
  dni?: string
  telefono?: string
  estado: EstadoUsuario
  created_at: string
  updated_at: string
}

// ──────────────────────────────────────────────────────────
// LOCACION
// ──────────────────────────────────────────────────────────
export interface Locacion {
  id: string
  empresa_id: string
  codigo: string
  nombre?: string
  descripcion?: string
  ubicacion_punto?: { lat: number; lng: number } // Transformado desde GEOMETRY
  activa: boolean
  created_at: string
  updated_at: string
}

// ──────────────────────────────────────────────────────────
// EQUIPO
// ──────────────────────────────────────────────────────────
export type TipoEquipo = 'torre' | 'perforadora' | 'plataforma' | 'workover' | 'otro'
export type EstadoEquipo = 'activo' | 'mantenimiento' | 'inactivo'

export interface Equipo {
  id: string
  empresa_contratista_id: string
  empresa_operadora_id?: string
  locacion_actual_id?: string
  nombre_equipo: string
  tipo_equipo?: TipoEquipo
  descripcion?: string
  estado: EstadoEquipo
  operador_asignado_id?: string
  ubicacion_punto?: { lat: number; lng: number }
  fecha_ultima_ubicacion?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  // Joins opcionales
  locacion?: Locacion
  operador?: Usuario
  personas_dentro?: number
  tiene_incidente_pendiente?: boolean
}

// ──────────────────────────────────────────────────────────
// REGISTRO DE ACCESO
// ──────────────────────────────────────────────────────────
export type TipoDocumento = 'DNI' | 'Pasaporte' | 'LC' | 'LE'
export type EstadoRegistro = 'dentro' | 'afuera' | 'anulado'

export interface RegistroAcceso {
  id: string
  equipo_id: string
  locacion_id?: string
  empresa_visitante_id?: string
  empresa_visitante_nombre?: string
  tipo_documento: TipoDocumento
  dni: string
  nombre_completo: string
  funcion_visitante?: string
  motivo_visita: string
  vehiculo_patente?: string
  fecha_ingreso: string
  fecha_egreso?: string
  firma_ingreso_storage_path?: string
  firma_ingreso_data?: string
  firma_egreso_storage_path?: string
  firma_egreso_data?: string
  declara_incidente?: boolean
  firma_declaracion_storage_path?: string
  firma_declaracion_data?: string
  ubicacion_ingreso?: { lat: number; lng: number }
  precision_metros_ingreso?: number
  ubicacion_egreso?: { lat: number; lng: number }
  precision_metros_egreso?: number
  estado: EstadoRegistro
  motivo_anulacion?: string
  registrado_por_usuario_id: string
  actualizado_por_usuario_id?: string
  created_at_local?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  // Joins opcionales
  equipo?: Equipo
  locacion?: Locacion
  registrado_por?: Usuario
}

// ──────────────────────────────────────────────────────────
// INCIDENTE
// ──────────────────────────────────────────────────────────
export type TipoIncidente = 'lesion' | 'accidente' | 'casi_accidente' | 'dano_material' | 'enfermedad' | 'otro'
export type GravedadIncidente = 'leve' | 'moderado' | 'grave' | 'critico'
export type EstadoIncidente = 'pendiente' | 'investigando' | 'cerrado'

export interface Incidente {
  id: string
  registro_acceso_id: string
  equipo_id: string
  locacion_id?: string
  dni_afectado: string
  nombre_afectado: string
  empresa_afectado?: string
  funcion_afectado?: string
  descripcion: string
  tipo?: TipoIncidente
  gravedad: GravedadIncidente
  dias_perdidos: number
  informo_jefe_turno: boolean
  jefe_turno_nombre?: string
  firma_jefe_storage_path?: string
  firma_jefe_data?: string
  estado: EstadoIncidente
  conclusion_investigacion?: string
  acciones_correctivas?: string
  investigado_por?: string
  fecha_cierre?: string
  fecha_incidente: string
  created_at: string
  updated_at: string
  // Joins opcionales
  equipo?: Equipo
}

// ──────────────────────────────────────────────────────────
// DOCUMENTO DE SEGURIDAD
// ──────────────────────────────────────────────────────────
export type TipoDocumentoSeguridad = 'ATS' | 'Induccion' | 'Permiso_Trabajo' | 'Certificacion_ART' | 'Habilitacion' | 'Otro'

export interface DocumentoSeguridad {
  id: string
  empresa_id: string
  dni_titular: string
  nombre_titular?: string
  tipo: TipoDocumentoSeguridad
  nombre_documento?: string
  numero_documento?: string
  fecha_emision?: string
  fecha_vencimiento?: string
  archivo_path?: string
  nivel_alerta: 'warning' | 'danger'
  bloqueante: boolean
  created_at: string
  updated_at: string
  // Computed
  vencido?: boolean
  dias_para_vencer?: number
}

// ──────────────────────────────────────────────────────────
// MÉTRICAS DIARIAS
// ──────────────────────────────────────────────────────────
export interface MetricasDiarias {
  id: string
  equipo_id: string
  fecha: string
  total_ingresos: number
  total_egresos: number
  horas_hombre_total: number
  promedio_permanencia_minutos: number
  pico_horario_entrada?: string
  pico_horario_salida?: string
  empresas_distintas: number
  total_incidentes: number
  incidentes_lesion: number
  incidentes_accidente: number
  incidentes_casi_accidente: number
  dias_sin_incidente: number
  indice_frecuencia?: number
  indice_gravedad?: number
}

// ──────────────────────────────────────────────────────────
// QUEUE OFFLINE
// ──────────────────────────────────────────────────────────
export type TipoOperacionOffline = 'insert_registro' | 'update_egreso' | 'insert_incidente'

export interface OperacionOffline {
  id: string
  tipo: TipoOperacionOffline
  tabla: string
  datos: Record<string, unknown>
  created_at_local: string
  intentos: number
  error_ultimo?: string
}

// ──────────────────────────────────────────────────────────
// FORMS — tipos de formulario
// ──────────────────────────────────────────────────────────
export interface FormIngresoData {
  dni: string
  tipo_documento: TipoDocumento
  nombre_completo: string
  empresa_visitante_nombre: string
  funcion_visitante: string
  motivo_visita: string
  vehiculo_patente?: string
  firma_data: string
}

export interface FormSalidaData {
  registro_id: string
  declara_incidente: boolean
  firma_declaracion_data: string
}

export interface FormIncidenteData {
  descripcion: string
  tipo: TipoIncidente
  gravedad: GravedadIncidente
  dias_perdidos: number
  informo_jefe_turno: boolean
  jefe_turno_nombre?: string
  firma_jefe_data?: string
}
