-- ─────────────────────────────────────────────────────
-- 006_triggers.sql
-- Triggers: updated_at, logs, métricas, alertas
-- ─────────────────────────────────────────────────────

-- updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_empresas_upd   BEFORE UPDATE ON empresas          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_equipos_upd    BEFORE UPDATE ON equipos           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_registros_upd  BEFORE UPDATE ON registros_acceso  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_incidentes_upd BEFORE UPDATE ON incidentes        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_metricas_upd   BEFORE UPDATE ON metricas_diarias  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_documentos_upd BEFORE UPDATE ON documentos_seguridad FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Log de auditoría en registros_acceso
CREATE OR REPLACE FUNCTION log_cambios_registro()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO logs_sistema(usuario_id, accion, tabla_afectada, registro_id, cambios_antes, cambios_despues)
  VALUES (
    auth.uid(),
    CASE TG_OP WHEN 'INSERT' THEN 'crear_registro' ELSE 'editar_registro' END,
    'registros_acceso',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_registros
  AFTER INSERT OR UPDATE ON registros_acceso
  FOR EACH ROW EXECUTE FUNCTION log_cambios_registro();

-- Actualizar métricas cuando cambia un registro de acceso
CREATE OR REPLACE FUNCTION trigger_actualizar_metricas_registro()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM actualizar_metricas_diarias(
    COALESCE(NEW.equipo_id, OLD.equipo_id),
    COALESCE(NEW.fecha_ingreso, OLD.fecha_ingreso)::DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_metricas_on_registro
  AFTER INSERT OR UPDATE ON registros_acceso
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_metricas_registro();

-- Actualizar métricas cuando se crea un incidente
CREATE OR REPLACE FUNCTION trigger_actualizar_metricas_incidente()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM actualizar_metricas_diarias(NEW.equipo_id, NEW.fecha_incidente::DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_metricas_on_incidente
  AFTER INSERT OR UPDATE ON incidentes
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_metricas_incidente();

-- Historial de ubicaciones del equipo al cambiar locación
CREATE OR REPLACE FUNCTION log_cambio_ubicacion_equipo()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.ubicacion_punto IS DISTINCT FROM NEW.ubicacion_punto)
     OR (OLD.locacion_actual_id IS DISTINCT FROM NEW.locacion_actual_id) THEN
    INSERT INTO historial_ubicaciones_equipo(
      equipo_id,
      locacion_anterior_id, locacion_nueva_id,
      ubicacion_anterior, ubicacion_nueva,
      actualizado_por
    ) VALUES (
      NEW.id,
      OLD.locacion_actual_id, NEW.locacion_actual_id,
      OLD.ubicacion_punto, NEW.ubicacion_punto,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_ubicacion_equipo
  AFTER UPDATE ON equipos
  FOR EACH ROW EXECUTE FUNCTION log_cambio_ubicacion_equipo();

-- Alerta push cuando se declara un incidente
-- Requiere la extensión pg_net disponible en Supabase
CREATE OR REPLACE FUNCTION notify_incidente()
RETURNS TRIGGER AS $$
BEGIN
  -- Intentar enviar la alerta via Edge Function
  -- Si pg_net no está disponible, el trigger falla silenciosamente
  BEGIN
    PERFORM net.http_post(
      url     := current_setting('app.supabase_url', true) || '/functions/v1/alert-incidente',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body    := jsonb_build_object('incidente_id', NEW.id, 'equipo_id', NEW.equipo_id)
    );
  EXCEPTION WHEN OTHERS THEN
    -- No bloquear el flujo si la notificación falla
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_incidente
  AFTER INSERT ON incidentes
  FOR EACH ROW EXECUTE FUNCTION notify_incidente();

-- Validar que el egreso no se cierre sin declaración de incidente
CREATE OR REPLACE FUNCTION validar_egreso_con_declaracion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'afuera' AND NEW.declara_incidente IS NULL THEN
    RAISE EXCEPTION 'No se puede cerrar el egreso sin completar la declaración de incidente';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_egreso
  BEFORE UPDATE ON registros_acceso
  FOR EACH ROW
  WHEN (NEW.estado = 'afuera' AND OLD.estado = 'dentro')
  EXECUTE FUNCTION validar_egreso_con_declaracion();
