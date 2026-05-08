-- ─────────────────────────────────────────────────────
-- 004_rls_policies.sql
-- Row Level Security completo por rol
-- ─────────────────────────────────────────────────────

-- Habilitar en todas las tablas
ALTER TABLE empresas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE locaciones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_acceso     ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidentes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_seguridad ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences            ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos_acceso      ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_diarias     ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sistema         ENABLE ROW LEVEL SECURITY;

-- ── HELPER FUNCTIONS ──────────────────────────────────
CREATE OR REPLACE FUNCTION auth_empresa_id() RETURNS UUID AS $$
  SELECT empresa_id FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_rol() RETURNS TEXT AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── EMPRESAS ──────────────────────────────────────────
CREATE POLICY "superadmin_all_empresas"
  ON empresas FOR ALL USING (auth_rol() = 'superadmin');

CREATE POLICY "admin_ver_su_empresa"
  ON empresas FOR SELECT USING (id = auth_empresa_id());

-- ── USUARIOS ──────────────────────────────────────────
CREATE POLICY "superadmin_all_usuarios"
  ON usuarios FOR ALL USING (auth_rol() = 'superadmin');

CREATE POLICY "admin_ver_usuarios_empresa"
  ON usuarios FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "admin_gestionar_usuarios_empresa"
  ON usuarios FOR ALL USING (
    empresa_id = auth_empresa_id() AND auth_rol() IN ('admin', 'supervisor')
  );

CREATE POLICY "user_ver_propio"
  ON usuarios FOR SELECT USING (id = auth.uid());

-- ── LOCACIONES ────────────────────────────────────────
CREATE POLICY "admin_all_locaciones"
  ON locaciones FOR ALL USING (empresa_id = auth_empresa_id());

CREATE POLICY "operador_ver_locacion_equipo"
  ON locaciones FOR SELECT USING (
    id IN (
      SELECT locacion_actual_id FROM equipos WHERE operador_asignado_id = auth.uid()
    )
  );

CREATE POLICY "auditor_ver_locaciones_autorizadas"
  ON locaciones FOR SELECT USING (
    id IN (
      SELECT l.id FROM locaciones l
      JOIN equipos e ON e.locacion_actual_id = l.id
      JOIN permisos_acceso pa ON pa.equipo_id = e.id
      WHERE pa.empresa_auditora_id = auth_empresa_id()
        AND pa.activo = TRUE
    )
  );

-- ── EQUIPOS ───────────────────────────────────────────
CREATE POLICY "superadmin_all_equipos"
  ON equipos FOR ALL USING (auth_rol() = 'superadmin');

CREATE POLICY "admin_select_sus_equipos"
  ON equipos FOR SELECT USING (empresa_contratista_id = auth_empresa_id());

CREATE POLICY "admin_insert_update_equipos"
  ON equipos FOR ALL USING (
    empresa_contratista_id = auth_empresa_id()
    AND auth_rol() IN ('admin', 'supervisor')
  );

CREATE POLICY "operador_select_su_equipo_asignado"
  ON equipos FOR SELECT USING (operador_asignado_id = auth.uid());

-- Operador puede actualizar coords de su equipo
CREATE POLICY "operador_update_coords"
  ON equipos FOR UPDATE USING (operador_asignado_id = auth.uid());

CREATE POLICY "auditor_select_equipos_autorizados"
  ON equipos FOR SELECT USING (
    id IN (
      SELECT equipo_id FROM permisos_acceso
      WHERE empresa_auditora_id = auth_empresa_id() AND activo = TRUE
    )
  );

-- ── REGISTROS_ACCESO ──────────────────────────────────
CREATE POLICY "superadmin_all_registros"
  ON registros_acceso FOR ALL USING (auth_rol() = 'superadmin');

CREATE POLICY "operador_select_su_equipo"
  ON registros_acceso FOR SELECT USING (
    equipo_id IN (SELECT id FROM equipos WHERE operador_asignado_id = auth.uid())
  );

CREATE POLICY "operador_insert_su_equipo"
  ON registros_acceso FOR INSERT WITH CHECK (
    equipo_id IN (SELECT id FROM equipos WHERE operador_asignado_id = auth.uid())
  );

-- Operador edita solo registros del día actual de su equipo
CREATE POLICY "operador_update_hoy"
  ON registros_acceso FOR UPDATE USING (
    equipo_id IN (SELECT id FROM equipos WHERE operador_asignado_id = auth.uid())
    AND fecha_ingreso::DATE = CURRENT_DATE
  );

CREATE POLICY "admin_select_sus_equipos_registros"
  ON registros_acceso FOR SELECT USING (
    equipo_id IN (
      SELECT id FROM equipos WHERE empresa_contratista_id = auth_empresa_id()
    )
  );

CREATE POLICY "admin_update_sus_equipos_registros"
  ON registros_acceso FOR UPDATE USING (
    equipo_id IN (
      SELECT id FROM equipos WHERE empresa_contratista_id = auth_empresa_id()
    ) AND auth_rol() IN ('admin', 'supervisor')
  );

-- Auditor: solo equipos autorizados con permiso vigente
CREATE POLICY "auditor_select_autorizados"
  ON registros_acceso FOR SELECT USING (
    equipo_id IN (
      SELECT equipo_id FROM permisos_acceso
      WHERE empresa_auditora_id = auth_empresa_id()
        AND activo = TRUE
        AND CURRENT_DATE BETWEEN fecha_inicio AND COALESCE(fecha_fin, CURRENT_DATE)
    )
  );

-- ── INCIDENTES ────────────────────────────────────────
CREATE POLICY "superadmin_all_incidentes"
  ON incidentes FOR ALL USING (auth_rol() = 'superadmin');

CREATE POLICY "admin_all_incidentes_empresa"
  ON incidentes FOR ALL USING (
    equipo_id IN (
      SELECT id FROM equipos WHERE empresa_contratista_id = auth_empresa_id()
    )
  );

CREATE POLICY "operador_select_incidentes_su_equipo"
  ON incidentes FOR SELECT USING (
    equipo_id IN (SELECT id FROM equipos WHERE operador_asignado_id = auth.uid())
  );

CREATE POLICY "operador_insert_incidente"
  ON incidentes FOR INSERT WITH CHECK (
    equipo_id IN (SELECT id FROM equipos WHERE operador_asignado_id = auth.uid())
  );

CREATE POLICY "auditor_select_incidentes_autorizados"
  ON incidentes FOR SELECT USING (
    equipo_id IN (
      SELECT equipo_id FROM permisos_acceso
      WHERE empresa_auditora_id = auth_empresa_id()
        AND activo = TRUE
        AND puede_ver_incidentes = TRUE
    )
  );

-- ── DOCUMENTOS DE SEGURIDAD ───────────────────────────
CREATE POLICY "admin_all_documentos"
  ON documentos_seguridad FOR ALL USING (empresa_id = auth_empresa_id());

CREATE POLICY "operador_select_documentos"
  ON documentos_seguridad FOR SELECT USING (empresa_id = auth_empresa_id());

-- ── MÉTRICAS DIARIAS ──────────────────────────────────
CREATE POLICY "admin_select_metricas"
  ON metricas_diarias FOR SELECT USING (
    equipo_id IN (
      SELECT id FROM equipos WHERE empresa_contratista_id = auth_empresa_id()
    )
  );

CREATE POLICY "admin_all_metricas"
  ON metricas_diarias FOR ALL USING (
    equipo_id IN (
      SELECT id FROM equipos WHERE empresa_contratista_id = auth_empresa_id()
    )
  );

CREATE POLICY "auditor_select_metricas"
  ON metricas_diarias FOR SELECT USING (
    equipo_id IN (
      SELECT equipo_id FROM permisos_acceso
      WHERE empresa_auditora_id = auth_empresa_id()
        AND activo = TRUE
        AND puede_ver_hse = TRUE
    )
  );

-- ── LOGS DE SISTEMA ───────────────────────────────────
CREATE POLICY "superadmin_all_logs"
  ON logs_sistema FOR SELECT USING (auth_rol() = 'superadmin');

CREATE POLICY "admin_ver_logs_empresa"
  ON logs_sistema FOR SELECT USING (
    usuario_id IN (
      SELECT id FROM usuarios WHERE empresa_id = auth_empresa_id()
    ) AND auth_rol() IN ('admin', 'supervisor')
  );
