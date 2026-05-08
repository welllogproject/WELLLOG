-- ─────────────────────────────────────────────────────
-- 007_seed.sql
-- Datos de prueba — NO correr en producción
-- Idempotente: ON CONFLICT DO NOTHING / DO UPDATE
-- ─────────────────────────────────────────────────────

-- Empresas
INSERT INTO empresas (id, nombre, tipo, razon_social, cuit, email_contacto, plan) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Venver',             'contratista', 'Venver S.A.',                '30123456789', 'admin@venver.com.ar',   'pro'),
  ('11111111-0000-0000-0000-000000000002', 'YPF',                'operadora',   'YPF S.A.',                   '30546689979', 'operaciones@ypf.com',   'enterprise'),
  ('11111111-0000-0000-0000-000000000003', 'Pan American Energy','contratista', 'Pan American Energy LLC',     '30689648969', 'admin@pae.com.ar',      'pro')
ON CONFLICT (id) DO UPDATE
  SET nombre         = EXCLUDED.nombre,
      tipo           = EXCLUDED.tipo,
      razon_social   = EXCLUDED.razon_social,
      cuit           = EXCLUDED.cuit,
      email_contacto = EXCLUDED.email_contacto,
      plan           = EXCLUDED.plan;

-- Locaciones
INSERT INTO locaciones (id, empresa_id, codigo, nombre, descripcion) VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'AAB 1012', 'Área AAB 1012', 'Área norte, cuenca neuquina'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'CAN 0045', 'Área CAN 0045', 'Área sur, cuenca del Golfo'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'MEN 0789', 'Área MEN 0789', 'Área central, Mendoza'),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', 'CHI 2201', 'Área CHI 2201', 'Área PAE - Chubut')
ON CONFLICT (id) DO UPDATE
  SET codigo      = EXCLUDED.codigo,
      nombre      = EXCLUDED.nombre,
      descripcion = EXCLUDED.descripcion;

-- Equipos Venver
INSERT INTO equipos (id, empresa_contratista_id, empresa_operadora_id, locacion_actual_id, nombre_equipo, tipo_equipo, estado) VALUES
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'V51',       'workover',    'activo'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'Venver 10', 'torre',       'activo'),
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003', 'Venver 22', 'perforadora', 'mantenimiento')
ON CONFLICT (id) DO UPDATE
  SET nombre_equipo      = EXCLUDED.nombre_equipo,
      tipo_equipo        = EXCLUDED.tipo_equipo,
      estado             = EXCLUDED.estado,
      locacion_actual_id = EXCLUDED.locacion_actual_id;

-- Equipos PAE
INSERT INTO equipos (id, empresa_contratista_id, empresa_operadora_id, locacion_actual_id, nombre_equipo, tipo_equipo, estado) VALUES
  ('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000004', 'PAE-01', 'torre', 'activo')
ON CONFLICT (id) DO UPDATE
  SET nombre_equipo      = EXCLUDED.nombre_equipo,
      tipo_equipo        = EXCLUDED.tipo_equipo,
      estado             = EXCLUDED.estado,
      locacion_actual_id = EXCLUDED.locacion_actual_id;

-- Usuarios de prueba
-- ⚠ Crear primero en Supabase Auth Dashboard o CLI, luego reemplazar los UUIDs.
--
-- Emails de referencia:
--   superadmin@welllog.com       → rol: superadmin (dueño de la plataforma)
--   admin@venver.com.ar          → rol: admin      (admin de Venver)
--   operador.v51@venver.com.ar   → rol: operador   (tablet equipo V51)
--   operador.v10@venver.com.ar   → rol: operador   (tablet equipo Venver 10)
--   auditor@ypf.com              → rol: auditor    (YPF)
--
-- INSERT INTO usuarios (id, empresa_id, email, nombre_completo, rol) VALUES
--   ('<uuid_superadmin>',    '11111111-0000-0000-0000-000000000001', 'superadmin@welllog.com',     'Super Admin WELL LOG', 'superadmin'),
--   ('<uuid_admin_venver>',  '11111111-0000-0000-0000-000000000001', 'admin@venver.com.ar',         'Administrador Venver', 'admin'),
--   ('<uuid_op_v51>',        '11111111-0000-0000-0000-000000000001', 'operador.v51@venver.com.ar',  'Carlos García',        'operador'),
--   ('<uuid_op_v10>',        '11111111-0000-0000-0000-000000000001', 'operador.v10@venver.com.ar',  'Martín López',         'operador'),
--   ('<uuid_auditor_ypf>',   '11111111-0000-0000-0000-000000000002', 'auditor@ypf.com',             'Auditor YPF',          'auditor')
-- ON CONFLICT (id) DO NOTHING;

-- Permisos de acceso: Venver comparte V51 y Venver 10 con YPF
INSERT INTO permisos_acceso (
  empresa_propietaria_id, empresa_auditora_id, equipo_id,
  tipo_acceso, puede_ver_incidentes, puede_ver_hse, puede_ver_coordenadas,
  fecha_inicio, activo
) VALUES
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001', 'lectura_en_vivo', TRUE,  TRUE,  FALSE, CURRENT_DATE, TRUE),
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'lectura_en_vivo', TRUE,  TRUE,  FALSE, CURRENT_DATE, TRUE),
  -- PAE comparte PAE-01 con YPF (independiente de Venver)
  ('11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000004', 'lectura',         FALSE, FALSE, FALSE, CURRENT_DATE, TRUE)
ON CONFLICT (empresa_propietaria_id, empresa_auditora_id, equipo_id) DO NOTHING;
