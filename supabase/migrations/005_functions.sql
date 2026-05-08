-- ─────────────────────────────────────────────────────
-- 005_functions.sql
-- Funciones PL/pgSQL auxiliares
-- ─────────────────────────────────────────────────────

-- Verificar si un DNI tiene registros pendientes de egreso en un equipo
CREATE OR REPLACE FUNCTION tiene_ingreso_activo(p_dni VARCHAR, p_equipo_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM registros_acceso
    WHERE dni = p_dni
      AND equipo_id = p_equipo_id
      AND estado = 'dentro'
      AND deleted_at IS NULL
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Calcular horas hombre del día para un equipo
CREATE OR REPLACE FUNCTION calcular_horas_hombre_dia(p_equipo_id UUID, p_fecha DATE)
RETURNS NUMERIC AS $$
  SELECT COALESCE(
    SUM(
      EXTRACT(EPOCH FROM (
        COALESCE(fecha_egreso, NOW()) - fecha_ingreso
      )) / 3600.0
    ), 0
  )
  FROM registros_acceso
  WHERE equipo_id = p_equipo_id
    AND fecha_ingreso::DATE = p_fecha
    AND deleted_at IS NULL
    AND estado != 'anulado';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Calcular índice de frecuencia HSE (IF)
-- IF = (N° incidentes con lesión / Horas hombre) × 200.000
CREATE OR REPLACE FUNCTION calcular_indice_frecuencia(p_incidentes INTEGER, p_horas_hombre NUMERIC)
RETURNS NUMERIC AS $$
  SELECT CASE
    WHEN p_horas_hombre = 0 THEN 0
    ELSE ROUND((p_incidentes::NUMERIC / p_horas_hombre) * 200000, 4)
  END;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Calcular índice de gravedad HSE (IG)
-- IG = (Días perdidos / Horas hombre) × 200.000
CREATE OR REPLACE FUNCTION calcular_indice_gravedad(p_dias_perdidos INTEGER, p_horas_hombre NUMERIC)
RETURNS NUMERIC AS $$
  SELECT CASE
    WHEN p_horas_hombre = 0 THEN 0
    ELSE ROUND((p_dias_perdidos::NUMERIC / p_horas_hombre) * 200000, 4)
  END;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Actualizar métricas diarias de un equipo
CREATE OR REPLACE FUNCTION actualizar_metricas_diarias(p_equipo_id UUID, p_fecha DATE)
RETURNS VOID AS $$
DECLARE
  v_total_ingresos INTEGER;
  v_total_egresos INTEGER;
  v_horas_hombre NUMERIC;
  v_empresas_distintas INTEGER;
  v_total_incidentes INTEGER;
  v_incidentes_lesion INTEGER;
  v_dias_perdidos INTEGER;
  v_if NUMERIC;
  v_ig NUMERIC;
BEGIN
  -- Calcular métricas de registros
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE estado = 'afuera'),
    COUNT(DISTINCT COALESCE(empresa_visitante_id::TEXT, empresa_visitante_nombre))
  INTO v_total_ingresos, v_total_egresos, v_empresas_distintas
  FROM registros_acceso
  WHERE equipo_id = p_equipo_id
    AND fecha_ingreso::DATE = p_fecha
    AND deleted_at IS NULL
    AND estado != 'anulado';

  v_horas_hombre := calcular_horas_hombre_dia(p_equipo_id, p_fecha);

  -- Calcular métricas de incidentes
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE tipo = 'lesion'),
    COALESCE(SUM(dias_perdidos), 0)
  INTO v_total_incidentes, v_incidentes_lesion, v_dias_perdidos
  FROM incidentes
  WHERE equipo_id = p_equipo_id
    AND fecha_incidente::DATE = p_fecha;

  v_if := calcular_indice_frecuencia(v_incidentes_lesion, v_horas_hombre);
  v_ig := calcular_indice_gravedad(v_dias_perdidos, v_horas_hombre);

  -- Upsert en métricas diarias
  INSERT INTO metricas_diarias (
    equipo_id, fecha,
    total_ingresos, total_egresos,
    horas_hombre_total, empresas_distintas,
    total_incidentes, incidentes_lesion,
    indice_frecuencia, indice_gravedad
  ) VALUES (
    p_equipo_id, p_fecha,
    v_total_ingresos, v_total_egresos,
    v_horas_hombre, v_empresas_distintas,
    v_total_incidentes, v_incidentes_lesion,
    v_if, v_ig
  )
  ON CONFLICT (equipo_id, fecha) DO UPDATE SET
    total_ingresos = EXCLUDED.total_ingresos,
    total_egresos = EXCLUDED.total_egresos,
    horas_hombre_total = EXCLUDED.horas_hombre_total,
    empresas_distintas = EXCLUDED.empresas_distintas,
    total_incidentes = EXCLUDED.total_incidentes,
    incidentes_lesion = EXCLUDED.incidentes_lesion,
    indice_frecuencia = EXCLUDED.indice_frecuencia,
    indice_gravedad = EXCLUDED.indice_gravedad,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
