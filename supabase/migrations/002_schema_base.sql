-- ─────────────────────────────────────────────────────
-- 002_schema_base.sql
-- Tablas principales del sistema
-- ─────────────────────────────────────────────────────

-- EMPRESAS
CREATE TABLE empresas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          VARCHAR(255) NOT NULL UNIQUE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('contratista', 'operadora')),
  razon_social    VARCHAR(255),
  cuit            VARCHAR(11) UNIQUE,
  email_contacto  VARCHAR(255),
  telefono        VARCHAR(20),
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  activa          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- USUARIOS
CREATE TABLE usuarios (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id      UUID NOT NULL REFERENCES empresas(id),
  email           VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  rol             TEXT NOT NULL CHECK (rol IN ('superadmin', 'admin', 'operador', 'auditor', 'supervisor')),
  dni             VARCHAR(20),
  telefono        VARCHAR(20),
  estado          TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- LOCACIONES
-- Entidad DISTINTA al equipo. Ej: "AAB 1012"
CREATE TABLE locaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id),
  codigo          VARCHAR(50) NOT NULL,
  nombre          VARCHAR(255),
  descripcion     TEXT,
  ubicacion_punto GEOMETRY(Point, 4326),
  activa          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

-- EQUIPOS
-- Ej: "VS1", "Venver 10". Opera en una locación.
CREATE TABLE equipos (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_contratista_id       UUID NOT NULL REFERENCES empresas(id),
  empresa_operadora_id         UUID REFERENCES empresas(id),
  locacion_actual_id           UUID REFERENCES locaciones(id),
  nombre_equipo                VARCHAR(255) NOT NULL,
  tipo_equipo                  TEXT CHECK (tipo_equipo IN ('torre', 'perforadora', 'plataforma', 'workover', 'otro')),
  descripcion                  TEXT,
  estado                       TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'mantenimiento', 'inactivo')),
  operador_asignado_id         UUID REFERENCES usuarios(id),
  ubicacion_punto              GEOMETRY(Point, 4326),
  coordenadas_actualizadas_por UUID REFERENCES usuarios(id),
  fecha_ultima_ubicacion       TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at                   TIMESTAMPTZ,
  UNIQUE(empresa_contratista_id, nombre_equipo)
);

CREATE INDEX idx_equipos_ubicacion ON equipos USING GIST(ubicacion_punto);

-- HISTORIAL DE UBICACIONES DE EQUIPOS
CREATE TABLE historial_ubicaciones_equipo (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id            UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  locacion_anterior_id UUID REFERENCES locaciones(id),
  locacion_nueva_id    UUID REFERENCES locaciones(id),
  ubicacion_anterior   GEOMETRY(Point, 4326),
  ubicacion_nueva      GEOMETRY(Point, 4326),
  actualizado_por      UUID NOT NULL REFERENCES usuarios(id),
  motivo_cambio        VARCHAR(255),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- REGISTROS DE ACCESO (Core)
-- Replica exactamente el formulario físico de Venver
CREATE TABLE registros_acceso (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id                    UUID NOT NULL REFERENCES equipos(id),
  locacion_id                  UUID REFERENCES locaciones(id),
  empresa_visitante_id         UUID REFERENCES empresas(id),
  empresa_visitante_nombre     VARCHAR(255),

  -- Datos del formulario físico
  tipo_documento               TEXT DEFAULT 'DNI' CHECK (tipo_documento IN ('DNI', 'Pasaporte', 'LC', 'LE')),
  dni                          VARCHAR(20) NOT NULL,
  nombre_completo              VARCHAR(255) NOT NULL,
  funcion_visitante            VARCHAR(255),
  motivo_visita                VARCHAR(255) NOT NULL,
  vehiculo_patente             VARCHAR(20),

  -- Timestamps (generados por el servidor)
  fecha_ingreso                TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_egreso                 TIMESTAMPTZ,

  -- Firmas de ingreso
  firma_ingreso_storage_path   TEXT,
  firma_ingreso_data           TEXT,

  -- Firmas de egreso
  firma_egreso_storage_path    TEXT,
  firma_egreso_data            TEXT,

  -- DECLARACIÓN DE INCIDENTE
  -- NULL = aún no completó la declaración (egreso pendiente)
  -- FALSE = firmó columna NO (sin incidente)
  -- TRUE  = firmó columna SÍ (hubo incidente)
  declara_incidente            BOOLEAN,
  firma_declaracion_storage_path TEXT,
  firma_declaracion_data       TEXT,

  -- Geolocalización (capturada desde la tablet, opcional)
  ubicacion_ingreso            GEOMETRY(Point, 4326),
  precision_metros_ingreso     INTEGER,
  ubicacion_egreso             GEOMETRY(Point, 4326),
  precision_metros_egreso      INTEGER,

  -- Estado
  estado                       TEXT NOT NULL DEFAULT 'dentro'
                               CHECK (estado IN ('dentro', 'afuera', 'anulado')),
  motivo_anulacion             TEXT,

  -- Auditoría
  registrado_por_usuario_id    UUID NOT NULL REFERENCES usuarios(id),
  actualizado_por_usuario_id   UUID REFERENCES usuarios(id),

  -- Timestamp real del dispositivo (para sync offline)
  created_at_local             TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at                   TIMESTAMPTZ,

  CONSTRAINT egreso_posterior_ingreso CHECK (
    fecha_egreso IS NULL OR fecha_egreso > fecha_ingreso
  )
);

CREATE INDEX idx_registros_equipo_estado  ON registros_acceso(equipo_id, estado);
CREATE INDEX idx_registros_dni            ON registros_acceso(dni);
CREATE INDEX idx_registros_fecha          ON registros_acceso(fecha_ingreso DESC);
CREATE INDEX idx_registros_ubicacion      ON registros_acceso USING GIST(ubicacion_ingreso);

-- VIEW para soft delete (siempre usar esta view en el frontend)
CREATE VIEW v_registros_acceso AS
  SELECT * FROM registros_acceso WHERE deleted_at IS NULL;
