-- ─────────────────────────────────────────────────────
-- 003_schema_hse.sql
-- Tablas HSE, seguridad y métricas
-- ─────────────────────────────────────────────────────

-- INCIDENTES
-- Se crea cuando declara_incidente = TRUE al egreso
CREATE TABLE incidentes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_acceso_id       UUID NOT NULL REFERENCES registros_acceso(id),
  equipo_id                UUID NOT NULL REFERENCES equipos(id),
  locacion_id              UUID REFERENCES locaciones(id),
  dni_afectado             VARCHAR(20) NOT NULL,
  nombre_afectado          VARCHAR(255) NOT NULL,
  empresa_afectado         VARCHAR(255),
  funcion_afectado         VARCHAR(255),

  -- Detalle del incidente
  descripcion              TEXT NOT NULL,
  tipo                     TEXT CHECK (tipo IN (
    'lesion', 'accidente', 'casi_accidente', 'dano_material', 'enfermedad', 'otro'
  )),
  gravedad                 TEXT DEFAULT 'leve' CHECK (gravedad IN (
    'leve', 'moderado', 'grave', 'critico'
  )),
  dias_perdidos            INTEGER DEFAULT 0,

  -- Jefe de turno
  informo_jefe_turno       BOOLEAN NOT NULL DEFAULT FALSE,
  jefe_turno_nombre        VARCHAR(255),
  firma_jefe_storage_path  TEXT,
  firma_jefe_data          TEXT,

  -- Investigación posterior
  estado                   TEXT DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente', 'investigando', 'cerrado'
  )),
  conclusion_investigacion TEXT,
  acciones_correctivas     TEXT,
  investigado_por          UUID REFERENCES usuarios(id),
  fecha_cierre             TIMESTAMPTZ,

  fecha_incidente          TIMESTAMPTZ NOT NULL,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTOS DE SEGURIDAD
-- ATS, Inducciones, Certificaciones con vencimiento
CREATE TABLE documentos_seguridad (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id),
  dni_titular       VARCHAR(20) NOT NULL,
  nombre_titular    VARCHAR(255),
  tipo              TEXT NOT NULL CHECK (tipo IN (
    'ATS', 'Induccion', 'Permiso_Trabajo', 'Certificacion_ART', 'Habilitacion', 'Otro'
  )),
  nombre_documento  VARCHAR(255),
  numero_documento  VARCHAR(100),
  fecha_emision     DATE,
  fecha_vencimiento DATE,
  archivo_path      TEXT,
  nivel_alerta      TEXT DEFAULT 'warning' CHECK (nivel_alerta IN ('warning', 'danger')),
  bloqueante        BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dni_titular, tipo, empresa_id)
);

-- GEOFENCES
CREATE TABLE geofences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id     UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  nombre_zona   VARCHAR(255),
  tipo_zona     TEXT DEFAULT 'info' CHECK (tipo_zona IN ('info', 'warning', 'danger')),
  geometria     GEOMETRY(Polygon, 4326),
  radio_metros  INTEGER,
  activa        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- PERMISOS DE ACCESO
-- Qué equipos puede auditar cada empresa (YPF → Venver 10, Venver 22)
CREATE TABLE permisos_acceso (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_propietaria_id  UUID NOT NULL REFERENCES empresas(id),
  empresa_auditora_id     UUID NOT NULL REFERENCES empresas(id),
  equipo_id               UUID REFERENCES equipos(id),
  tipo_acceso             TEXT DEFAULT 'lectura' CHECK (tipo_acceso IN (
    'lectura', 'lectura_en_vivo', 'reporte'
  )),
  puede_ver_incidentes    BOOLEAN DEFAULT FALSE,
  puede_ver_hse           BOOLEAN DEFAULT FALSE,
  puede_ver_coordenadas   BOOLEAN DEFAULT FALSE,
  fecha_inicio            DATE NOT NULL,
  fecha_fin               DATE,
  activo                  BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_propietaria_id, empresa_auditora_id, equipo_id)
);

-- MÉTRICAS DIARIAS (Desnormalizada para performance)
-- Actualizada por trigger en INSERT/UPDATE de registros_acceso e incidentes
CREATE TABLE metricas_diarias (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id                    UUID NOT NULL REFERENCES equipos(id),
  fecha                        DATE NOT NULL,
  total_ingresos               INTEGER DEFAULT 0,
  total_egresos                INTEGER DEFAULT 0,
  horas_hombre_total           NUMERIC(10,2) DEFAULT 0,
  promedio_permanencia_minutos INTEGER DEFAULT 0,
  pico_horario_entrada         TIME,
  pico_horario_salida          TIME,
  empresas_distintas           INTEGER DEFAULT 0,
  -- HSE
  total_incidentes             INTEGER DEFAULT 0,
  incidentes_lesion            INTEGER DEFAULT 0,
  incidentes_accidente         INTEGER DEFAULT 0,
  incidentes_casi_accidente    INTEGER DEFAULT 0,
  dias_sin_incidente           INTEGER DEFAULT 0,
  -- Índices IF e IG (estándar industria petrolera)
  indice_frecuencia            NUMERIC(8,4),
  indice_gravedad              NUMERIC(8,4),
  created_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(equipo_id, fecha)
);

-- LOGS DE SISTEMA (Auditoría completa de acciones)
CREATE TABLE logs_sistema (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID REFERENCES usuarios(id),
  accion          TEXT NOT NULL,
  tabla_afectada  TEXT,
  registro_id     UUID,
  cambios_antes   JSONB,
  cambios_despues JSONB,
  ip_origen       TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
