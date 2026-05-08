-- ─────────────────────────────────────────────────────
-- 007_seed.sql
-- Datos de prueba — NO correr en producción
-- ─────────────────────────────────────────────────────

-- Empresa contratista (Venver)
INSERT INTO empresas (id, nombre, tipo, razon_social, cuit, email_contacto, plan) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Venver', 'contratista', 'Venver S.A.', '30123456789', 'admin@venver.com.ar', 'pro');

-- Empresa operadora (YPF)
INSERT INTO empresas (id, nombre, tipo, razon_social, cuit, email_contacto, plan) VALUES
  ('11111111-0000-0000-0000-000000000002', 'YPF', 'operadora', 'YPF S.A.', '30546689979', 'operaciones@ypf.com', 'enterprise');

-- Locaciones (pozos)
INSERT INTO locaciones (id, empresa_id, codigo, nombre, descripcion) VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'AAB 1012', 'Área AAB 1012', 'Área norte, cuenca neuquina'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'CAN 0045', 'Área CAN 0045', 'Área sur, cuenca del Golfo'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'MEN 0789', 'Área MEN 0789', 'Área central, Mendoza');

-- Equipos
INSERT INTO equipos (id, empresa_contratista_id, empresa_operadora_id, locacion_actual_id, nombre_equipo, tipo_equipo, estado) VALUES
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'VS1', 'workover', 'activo'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'Venver 10', 'torre', 'activo'),
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003', 'Venver 22', 'perforadora', 'mantenimiento');

-- Nota: Los usuarios de prueba deben crearse desde Supabase Auth Dashboard
-- o usando el CLI. Una vez creados, insertar en la tabla usuarios:
-- INSERT INTO usuarios (id, empresa_id, email, nombre_completo, rol) VALUES
--   ('<auth_user_id>', '11111111-0000-0000-0000-000000000001', 'admin@venver.com.ar', 'Administrador Venver', 'admin'),
--   ('<auth_user_id>', '11111111-0000-0000-0000-000000000001', 'operador.vs1@venver.com.ar', 'Carlos García', 'operador'),
--   ('<auth_user_id>', '11111111-0000-0000-0000-000000000002', 'auditor@ypf.com', 'Auditor YPF', 'auditor');

-- Permiso de acceso para YPF
INSERT INTO permisos_acceso (
  empresa_propietaria_id, empresa_auditora_id, equipo_id,
  tipo_acceso, puede_ver_incidentes, puede_ver_hse, puede_ver_coordenadas,
  fecha_inicio, activo
) VALUES
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001', 'lectura_en_vivo', TRUE, TRUE, FALSE, CURRENT_DATE, TRUE),
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'lectura_en_vivo', TRUE, TRUE, FALSE, CURRENT_DATE, TRUE);
