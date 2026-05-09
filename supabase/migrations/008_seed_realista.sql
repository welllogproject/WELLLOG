-- ─────────────────────────────────────────────────────────────────────────────
-- 008_seed_realista.sql
-- Datos realistas del sector petrolero argentino para pruebas completas
-- Empresas reales que operan en Neuquén, Chubut, Santa Cruz y Mendoza
-- NO correr en producción
-- ─────────────────────────────────────────────────────────────────────────────

-- Deshabilitar triggers que usan auth.uid() durante el seed
ALTER TABLE equipos DISABLE TRIGGER trg_log_ubicacion_equipo;
ALTER TABLE registros_acceso DISABLE TRIGGER trg_log_registros;
ALTER TABLE registros_acceso DISABLE TRIGGER trg_metricas_on_registro;
ALTER TABLE incidentes DISABLE TRIGGER trg_metricas_on_incidente;
ALTER TABLE incidentes DISABLE TRIGGER trg_notify_incidente;

-- ── EMPRESAS ADICIONALES ──────────────────────────────────────────────────────
-- Operadoras reales de Argentina
INSERT INTO empresas (id, nombre, tipo, razon_social, cuit, email_contacto, telefono, plan, activa) VALUES
  ('11111111-0000-0000-0000-000000000010', 'TotalEnergies',        'operadora',   'TotalEnergies EP Argentina S.A.',    '30714644764', 'operaciones@totalenergies.com.ar', '+54 299 4480000', 'enterprise', true),
  ('11111111-0000-0000-0000-000000000011', 'Tecpetrol',            'operadora',   'Tecpetrol S.A.',                     '30500010084', 'operaciones@tecpetrol.com',        '+54 299 4490000', 'enterprise', true),
  ('11111111-0000-0000-0000-000000000012', 'Vista Energy',         'operadora',   'Vista Oil & Gas Argentina S.A.U.',   '30716040458', 'operaciones@vistaenergy.com',      '+54 299 4470000', 'pro',        true),
  ('11111111-0000-0000-0000-000000000013', 'Pampa Energía',        'operadora',   'Pampa Energía S.A.',                 '30500010085', 'operaciones@pampaenergia.com.ar',  '+54 11 43481000', 'pro',        true)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, tipo = EXCLUDED.tipo, razon_social = EXCLUDED.razon_social,
  cuit = EXCLUDED.cuit, email_contacto = EXCLUDED.email_contacto, plan = EXCLUDED.plan;

-- Contratistas reales de servicios petroleros en Argentina
INSERT INTO empresas (id, nombre, tipo, razon_social, cuit, email_contacto, telefono, plan, activa) VALUES
  ('11111111-0000-0000-0000-000000000020', 'Schlumberger',         'contratista', 'Schlumberger Argentina S.A.',        '30500010086', 'admin@slb.com.ar',                 '+54 299 4420000', 'enterprise', true),
  ('11111111-0000-0000-0000-000000000021', 'Halliburton',          'contratista', 'Halliburton Argentina S.A.',         '30500010087', 'admin@halliburton.com.ar',         '+54 299 4430000', 'enterprise', true),
  ('11111111-0000-0000-0000-000000000022', 'Weatherford',          'contratista', 'Weatherford Argentina S.A.',         '30500010088', 'admin@weatherford.com.ar',         '+54 299 4440000', 'pro',        true),
  ('11111111-0000-0000-0000-000000000023', 'Baker Hughes',         'contratista', 'Baker Hughes Argentina S.R.L.',      '30500010089', 'admin@bakerhughes.com.ar',         '+54 299 4450000', 'pro',        true),
  ('11111111-0000-0000-0000-000000000024', 'Calfrac Well Services','contratista', 'Calfrac Well Services Argentina',    '30500010090', 'admin@calfrac.com.ar',             '+54 299 4460000', 'pro',        true),
  ('11111111-0000-0000-0000-000000000025', 'Tenaris',              'contratista', 'Tenaris Siderca S.A.I.C.',           '30500010091', 'admin@tenaris.com',                '+54 3325 660000', 'pro',        true),
  ('11111111-0000-0000-0000-000000000026', 'Servicios Rio Mayo',   'contratista', 'Servicios Rio Mayo S.R.L.',          '30500010092', 'admin@srm.com.ar',                 '+54 297 4890000', 'free',       true)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, tipo = EXCLUDED.tipo, razon_social = EXCLUDED.razon_social,
  cuit = EXCLUDED.cuit, email_contacto = EXCLUDED.email_contacto, plan = EXCLUDED.plan;

-- ── LOCACIONES ADICIONALES ────────────────────────────────────────────────────
-- Locaciones reales de Vaca Muerta y otras cuencas
INSERT INTO locaciones (id, empresa_id, codigo, nombre, descripcion, ubicacion_punto, activa) VALUES
  -- Venver — más locaciones en Neuquén
  ('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000001', 'LOM 3301', 'Loma Campana 3301',  'Vaca Muerta — bloque Loma Campana',    ST_GeomFromText('POINT(-68.8234 -38.6891)', 4326), true),
  ('22222222-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000001', 'BAJ 0112', 'Bajada del Palo 112','Cuenca Neuquina — Bajada del Palo',    ST_GeomFromText('POINT(-68.5123 -38.9234)', 4326), true),
  ('22222222-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000001', 'AGU 0445', 'Aguada Pichana 445', 'Vaca Muerta — Aguada Pichana Este',    ST_GeomFromText('POINT(-68.9876 -38.4567)', 4326), true),
  -- PAE — Chubut y Santa Cruz
  ('22222222-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000003', 'SAN 1102', 'San Jorge 1102',     'Cuenca San Jorge — Chubut',            ST_GeomFromText('POINT(-68.1234 -45.8765)', 4326), true),
  ('22222222-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000003', 'COL 0334', 'Colihuincul 334',    'Cuenca Neuquina — Colihuincul',        ST_GeomFromText('POINT(-69.2345 -38.1234)', 4326), true),
  -- Schlumberger — locaciones propias
  ('22222222-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000020', 'NEU 0891', 'Neuquén Base 891',   'Base operativa Neuquén capital',       ST_GeomFromText('POINT(-68.0591 -38.9516)', 4326), true)
ON CONFLICT (id) DO UPDATE SET
  codigo = EXCLUDED.codigo, nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion, ubicacion_punto = EXCLUDED.ubicacion_punto;

-- Actualizar coordenadas de locaciones existentes
UPDATE locaciones SET ubicacion_punto = ST_GeomFromText('POINT(-68.7234 -38.5891)', 4326)
  WHERE id = '22222222-0000-0000-0000-000000000001'; -- AAB 1012
UPDATE locaciones SET ubicacion_punto = ST_GeomFromText('POINT(-65.1234 -45.8234)', 4326)
  WHERE id = '22222222-0000-0000-0000-000000000002'; -- CAN 0045
UPDATE locaciones SET ubicacion_punto = ST_GeomFromText('POINT(-68.3456 -34.8765)', 4326)
  WHERE id = '22222222-0000-0000-0000-000000000003'; -- MEN 0789

-- ── EQUIPOS ADICIONALES ───────────────────────────────────────────────────────
-- Más equipos de Venver
INSERT INTO equipos (id, empresa_contratista_id, empresa_operadora_id, locacion_actual_id, nombre_equipo, tipo_equipo, estado, ubicacion_punto) VALUES
  ('33333333-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000010', 'V31',       'workover',    'activo',        ST_GeomFromText('POINT(-68.8234 -38.6891)', 4326)),
  ('33333333-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000011', '22222222-0000-0000-0000-000000000011', 'V42',       'torre',       'activo',        ST_GeomFromText('POINT(-68.5123 -38.9234)', 4326)),
  ('33333333-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000012', '22222222-0000-0000-0000-000000000012', 'Venver 33', 'perforadora', 'activo',        ST_GeomFromText('POINT(-68.9876 -38.4567)', 4326)),
  ('33333333-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Venver 44', 'workover',    'inactivo',      NULL),
  -- Equipos PAE
  ('33333333-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000013', 'PAE-02',    'torre',       'activo',        ST_GeomFromText('POINT(-68.1234 -45.8765)', 4326)),
  ('33333333-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000014', 'PAE-03',    'perforadora', 'mantenimiento', ST_GeomFromText('POINT(-69.2345 -38.1234)', 4326)),
  -- Equipos Schlumberger
  ('33333333-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000010', 'SLB-NQ01',  'workover',    'activo',        ST_GeomFromText('POINT(-68.8100 -38.7000)', 4326)),
  ('33333333-0000-0000-0000-000000000017', '11111111-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000011', '22222222-0000-0000-0000-000000000015', 'SLB-NQ02',  'torre',       'activo',        ST_GeomFromText('POINT(-68.0591 -38.9516)', 4326))
ON CONFLICT (id) DO UPDATE SET
  nombre_equipo = EXCLUDED.nombre_equipo, tipo_equipo = EXCLUDED.tipo_equipo,
  estado = EXCLUDED.estado, locacion_actual_id = EXCLUDED.locacion_actual_id,
  ubicacion_punto = EXCLUDED.ubicacion_punto;

-- Actualizar coordenadas de equipos existentes (con coordenadas_actualizadas_por para el trigger)
UPDATE equipos SET
  ubicacion_punto = ST_GeomFromText('POINT(-68.7234 -38.5891)', 4326),
  coordenadas_actualizadas_por = 'bdb63b05-098a-4536-9c33-6eeceee1b6bf',
  fecha_ultima_ubicacion = NOW()
WHERE id = '33333333-0000-0000-0000-000000000001'; -- V51
UPDATE equipos SET
  ubicacion_punto = ST_GeomFromText('POINT(-65.1234 -45.8234)', 4326),
  coordenadas_actualizadas_por = 'bdb63b05-098a-4536-9c33-6eeceee1b6bf',
  fecha_ultima_ubicacion = NOW()
WHERE id = '33333333-0000-0000-0000-000000000002'; -- Venver 10
UPDATE equipos SET
  ubicacion_punto = ST_GeomFromText('POINT(-68.3456 -34.8765)', 4326),
  coordenadas_actualizadas_por = 'bdb63b05-098a-4536-9c33-6eeceee1b6bf',
  fecha_ultima_ubicacion = NOW()
WHERE id = '33333333-0000-0000-0000-000000000003'; -- Venver 22

-- ── PERMISOS DE ACCESO ADICIONALES ───────────────────────────────────────────
INSERT INTO permisos_acceso (empresa_propietaria_id, empresa_auditora_id, equipo_id, tipo_acceso, puede_ver_incidentes, puede_ver_hse, puede_ver_coordenadas, fecha_inicio, activo) VALUES
  -- Venver comparte V31 y V42 con TotalEnergies
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000010', 'lectura_en_vivo', true,  true,  false, CURRENT_DATE, true),
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000011', 'lectura_en_vivo', true,  true,  false, CURRENT_DATE, true),
  -- Venver comparte Venver 33 con Vista Energy
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000012', '33333333-0000-0000-0000-000000000012', 'lectura',         false, false, false, CURRENT_DATE, true),
  -- PAE comparte PAE-02 con YPF y TotalEnergies
  ('11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000014', 'lectura_en_vivo', true,  true,  false, CURRENT_DATE, true),
  ('11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000014', 'lectura',         false, true,  false, CURRENT_DATE, true),
  -- Schlumberger comparte SLB-NQ01 con TotalEnergies
  ('11111111-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000016', 'lectura_en_vivo', true,  true,  true,  CURRENT_DATE, true)
ON CONFLICT (empresa_propietaria_id, empresa_auditora_id, equipo_id) DO NOTHING;

-- ── REGISTROS DE ACCESO — últimos 30 días ────────────────────────────────────
-- Personas reales del sector con nombres argentinos
-- Equipo V51 (AAB 1012) — activo, varios ingresos/egresos

DO $$
DECLARE
  v_admin_id UUID;
  v_equipo_v51 UUID := '33333333-0000-0000-0000-000000000001';
  v_equipo_v10 UUID := '33333333-0000-0000-0000-000000000002';
  v_equipo_v22 UUID := '33333333-0000-0000-0000-000000000003';
  v_equipo_v31 UUID := '33333333-0000-0000-0000-000000000010';
  v_equipo_v42 UUID := '33333333-0000-0000-0000-000000000011';
  v_equipo_pae02 UUID := '33333333-0000-0000-0000-000000000014';
  v_loc_aab UUID := '22222222-0000-0000-0000-000000000001';
  v_loc_can UUID := '22222222-0000-0000-0000-000000000002';
  v_loc_men UUID := '22222222-0000-0000-0000-000000000003';
  v_loc_lom UUID := '22222222-0000-0000-0000-000000000010';
  v_loc_baj UUID := '22222222-0000-0000-0000-000000000011';
BEGIN
  -- Obtener el admin de Venver como registrado_por
  SELECT id INTO v_admin_id FROM usuarios WHERE email = 'admin@venver.com.ar' LIMIT 1;
  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'admin@venver.com.ar no encontrado, usando UUID fijo';
    v_admin_id := 'bdb63b05-098a-4536-9c33-6eeceee1b6bf';
  END IF;

  -- ── V51 — AAB 1012 ──────────────────────────────────────────────────────────
  INSERT INTO registros_acceso (equipo_id, locacion_id, dni, nombre_completo, empresa_visitante_nombre, funcion_visitante, motivo_visita, fecha_ingreso, fecha_egreso, estado, declara_incidente, registrado_por_usuario_id, firma_ingreso_data, firma_declaracion_data) VALUES
    (v_equipo_v51, v_loc_aab, '35127890', 'Martínez González, Sebastián',  'Schlumberger',          'Técnico de Campo',          'Trabajo en Pozo',             NOW() - INTERVAL '1 day 8 hours',  NOW() - INTERVAL '1 day 2 hours',  'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v51, v_loc_aab, '27345678', 'Rodríguez Pérez, Alejandro',    'Halliburton',           'Ingeniero de Perforación',  'Supervisión de Operaciones',  NOW() - INTERVAL '2 days 6 hours', NOW() - INTERVAL '2 days 1 hour',  'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v51, v_loc_aab, '30456789', 'López Fernández, Carlos',       'Weatherford Argentina', 'Técnico de Completación',   'Mantenimiento de Equipo',     NOW() - INTERVAL '3 days 7 hours', NOW() - INTERVAL '3 days 2 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v51, v_loc_aab, '33567890', 'García Suárez, Pablo',          'Baker Hughes',          'Especialista en Fluidos',   'Trabajo en Pozo',             NOW() - INTERVAL '4 days 9 hours', NOW() - INTERVAL '4 days 3 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v51, v_loc_aab, '28678901', 'Sánchez Torres, Diego',         'Calfrac Well Services', 'Operador de Fractura',      'Trabajo en Pozo',             NOW() - INTERVAL '5 days 8 hours', NOW() - INTERVAL '5 days 1 hour',  'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v51, v_loc_aab, '31789012', 'Romero Díaz, Facundo',          'Tenaris',               'Técnico de Tubería',        'Entrega de Materiales',       NOW() - INTERVAL '6 days 10 hours',NOW() - INTERVAL '6 days 4 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v51, v_loc_aab, '25890123', 'Flores Medina, Ramiro',         'YPF S.A.',              'Inspector HSE',             'Inspección de Seguridad',     NOW() - INTERVAL '7 days 7 hours', NOW() - INTERVAL '7 days 2 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v51, v_loc_aab, '36901234', 'Herrera Vega, Nicolás',         'Schlumberger',          'Técnico de Registros',      'Trabajo en Pozo',             NOW() - INTERVAL '8 days 8 hours', NOW() - INTERVAL '8 days 3 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v51, v_loc_aab, '29012345', 'Morales Castro, Gustavo',       'Calfrac Well Services', 'Operador de Equipos Pesados','Trabajo en Pozo',            NOW() - INTERVAL '10 days 9 hours',NOW() - INTERVAL '10 days 2 hours','afuera', true,  v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v51, v_loc_aab, '32123456', 'Aguirre Ríos, Federico',        'Baker Hughes',          'Técnico de Directional Drilling','Trabajo en Pozo',        NOW() - INTERVAL '12 days 8 hours',NOW() - INTERVAL '12 days 1 hour', 'afuera', true,  v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    -- Personas actualmente DENTRO
    (v_equipo_v51, v_loc_aab, '35127891', 'González Pereyra, Martina',     'Schlumberger',          'Ingeniera de Yacimientos',  'Evaluación de pozo',          NOW() - INTERVAL '2 hours',        NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL),
    (v_equipo_v51, v_loc_aab, '27345679', 'Mitre Sosa, Alejandro',         'Halliburton',           'Técnico de Campo',          'Análisis de producción',      NOW() - INTERVAL '3 hours',        NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL),
    (v_equipo_v51, v_loc_aab, '30456790', 'Rodríguez Blanco, Carlos',      'Weatherford Argentina', 'Técnico de Completación',   'Mantenimiento preventivo',    NOW() - INTERVAL '4 hours',        NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL),
    (v_equipo_v51, v_loc_aab, '39012346', 'Sosa Peralta, Valeria',         'Baker Hughes',          'Especialista en Fluidos',   'Completación de pozo',        NOW() - INTERVAL '5 hours',        NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL),
    (v_equipo_v51, v_loc_aab, '41234568', 'Zapata Molina, Nicolás',        'Halliburton',           'Técnico de Perforación',    'Control de fluidos',          NOW() - INTERVAL '6 hours',        NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL);

  -- ── Venver 10 — CAN 0045 ────────────────────────────────────────────────────
  INSERT INTO registros_acceso (equipo_id, locacion_id, dni, nombre_completo, empresa_visitante_nombre, funcion_visitante, motivo_visita, fecha_ingreso, fecha_egreso, estado, declara_incidente, registrado_por_usuario_id, firma_ingreso_data, firma_declaracion_data) VALUES
    (v_equipo_v10, v_loc_can, '26234567', 'Pereyra Núñez, Lucía',          'Venver S.A.',           'Supervisora de Operaciones','Supervisión de Operaciones',  NOW() - INTERVAL '1 day 7 hours',  NOW() - INTERVAL '1 day 1 hour',   'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v10, v_loc_can, '38345678', 'Fernández López, Roberto',      'YPF S.A.',              'Auditor de Seguridad',      'Auditoría HSE',               NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '2 days 2 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v10, v_loc_can, '24456789', 'Torres Acosta, Marcelo',        'Schlumberger',          'Técnico de Wireline',       'Trabajo en Pozo',             NOW() - INTERVAL '3 days 9 hours', NOW() - INTERVAL '3 days 3 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v10, v_loc_can, '37567890', 'Ruiz Molina, Andrés',           'Halliburton',           'Ingeniero de Cementación',  'Trabajo en Pozo',             NOW() - INTERVAL '4 days 7 hours', NOW() - INTERVAL '4 days 2 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v10, v_loc_can, '22678901', 'Vargas Ibáñez, Cristian',       'Weatherford Argentina', 'Técnico de Pesca',          'Mantenimiento de Equipo',     NOW() - INTERVAL '5 days 8 hours', NOW() - INTERVAL '5 days 1 hour',  'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v10, v_loc_can, '40789012', 'Medina Quiroga, Sofía',         'Venver S.A.',           'Técnica de Seguridad',      'Inspección de Seguridad',     NOW() - INTERVAL '6 days 6 hours', NOW() - INTERVAL '6 days 1 hour',  'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    -- Dentro ahora
    (v_equipo_v10, v_loc_can, '38954789', 'Pereyra Sosa, Roberto',         'Venver S.A.',           'Jefe de Turno',             'Supervisión de Operaciones',  NOW() - INTERVAL '1 hour',         NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL),
    (v_equipo_v10, v_loc_can, '26789013', 'Fernández Ruiz, Lucía',         'YPF S.A.',              'Auditora HSE',              'Auditoría HSE',                NOW() - INTERVAL '2 hours',        NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL),
    (v_equipo_v10, v_loc_can, '33890124', 'López Sánchez, Sandra',         'Venver S.A.',           'Revisión de operaciones',   'Supervisión de Operaciones',  NOW() - INTERVAL '3 hours',        NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL);

  -- ── Venver 22 — MEN 0789 (en mantenimiento) ─────────────────────────────────
  INSERT INTO registros_acceso (equipo_id, locacion_id, dni, nombre_completo, empresa_visitante_nombre, funcion_visitante, motivo_visita, fecha_ingreso, fecha_egreso, estado, declara_incidente, registrado_por_usuario_id, firma_ingreso_data, firma_declaracion_data) VALUES
    (v_equipo_v22, v_loc_men, '34901235', 'Castillo Vera, Hernán',         'Venver S.A.',           'Mecánico de Equipos',       'Mantenimiento de Equipo',     NOW() - INTERVAL '2 days 5 hours', NOW() - INTERVAL '2 days 1 hour',  'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v22, v_loc_men, '28012346', 'Ortiz Campos, Javier',          'Tenaris',               'Técnico de Tubería',        'Entrega de Materiales',       NOW() - INTERVAL '3 days 6 hours', NOW() - INTERVAL '3 days 2 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo=');

  -- ── V31 — Loma Campana (TotalEnergies) ──────────────────────────────────────
  INSERT INTO registros_acceso (equipo_id, locacion_id, dni, nombre_completo, empresa_visitante_nombre, funcion_visitante, motivo_visita, fecha_ingreso, fecha_egreso, estado, declara_incidente, registrado_por_usuario_id, firma_ingreso_data, firma_declaracion_data) VALUES
    (v_equipo_v31, v_loc_lom, '36123457', 'Navarro Espinoza, Tomás',       'TotalEnergies',         'Ingeniero de Reservorios',  'Evaluación de pozo',          NOW() - INTERVAL '1 day 6 hours',  NOW() - INTERVAL '1 day 1 hour',   'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v31, v_loc_lom, '30234568', 'Ramos Delgado, Patricia',       'Schlumberger',          'Técnica de Registros',      'Trabajo en Pozo',             NOW() - INTERVAL '2 days 7 hours', NOW() - INTERVAL '2 days 2 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v31, v_loc_lom, '24345679', 'Mendoza Arias, Claudio',        'Calfrac Well Services', 'Operador de Fractura',      'Trabajo en Pozo',             NOW() - INTERVAL '3 days 8 hours', NOW() - INTERVAL '3 days 3 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    -- Dentro
    (v_equipo_v31, v_loc_lom, '38456790', 'Silva Paredes, Ignacio',        'TotalEnergies',         'Supervisor de Operaciones', 'Supervisión de Operaciones',  NOW() - INTERVAL '4 hours',        NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL),
    (v_equipo_v31, v_loc_lom, '32567901', 'Guerrero Salinas, Verónica',    'Schlumberger',          'Técnica de Cementación',    'Trabajo en Pozo',             NOW() - INTERVAL '5 hours',        NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL);

  -- ── V42 — Bajada del Palo (Tecpetrol) ───────────────────────────────────────
  INSERT INTO registros_acceso (equipo_id, locacion_id, dni, nombre_completo, empresa_visitante_nombre, funcion_visitante, motivo_visita, fecha_ingreso, fecha_egreso, estado, declara_incidente, registrado_por_usuario_id, firma_ingreso_data, firma_declaracion_data) VALUES
    (v_equipo_v42, v_loc_baj, '26678902', 'Reyes Montoya, Esteban',        'Tecpetrol',             'Ingeniero de Producción',   'Supervisión de Operaciones',  NOW() - INTERVAL '1 day 5 hours',  NOW() - INTERVAL '1 day 1 hour',   'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    (v_equipo_v42, v_loc_baj, '34789013', 'Jiménez Rojas, Daniela',        'Baker Hughes',          'Técnica de MWD',            'Trabajo en Pozo',             NOW() - INTERVAL '2 days 6 hours', NOW() - INTERVAL '2 days 2 hours', 'afuera', false, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', 'data:image/png;base64,iVBORw0KGgo='),
    -- Dentro
    (v_equipo_v42, v_loc_baj, '28890124', 'Cabrera Fuentes, Rodrigo',      'Tecpetrol',             'Jefe de Turno',             'Supervisión de Operaciones',  NOW() - INTERVAL '3 hours',        NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL),
    (v_equipo_v42, v_loc_baj, '36901235', 'Ponce Heredia, Lorena',         'Halliburton',           'Técnica de Perforación',    'Trabajo en Pozo',             NOW() - INTERVAL '4 hours',        NULL,                              'dentro', NULL, v_admin_id, 'data:image/png;base64,iVBORw0KGgo=', NULL);

END $$;

-- ── INCIDENTES ────────────────────────────────────────────────────────────────
-- Basados en los registros con declara_incidente = true
DO $$
DECLARE
  v_admin_id UUID;
  v_reg_morales UUID;
  v_reg_aguirre UUID;
  v_equipo_v51 UUID := '33333333-0000-0000-0000-000000000001';
  v_equipo_v10 UUID := '33333333-0000-0000-0000-000000000002';
  v_loc_aab UUID := '22222222-0000-0000-0000-000000000001';
  v_loc_can UUID := '22222222-0000-0000-0000-000000000002';
BEGIN
  SELECT id INTO v_admin_id FROM usuarios WHERE email = 'admin@venver.com.ar' LIMIT 1;
  IF v_admin_id IS NULL THEN v_admin_id := 'bdb63b05-098a-4536-9c33-6eeceee1b6bf'; END IF;

  -- Obtener IDs de los registros con incidente
  SELECT id INTO v_reg_morales FROM registros_acceso
    WHERE dni = '29012345' AND equipo_id = v_equipo_v51 LIMIT 1;
  SELECT id INTO v_reg_aguirre FROM registros_acceso
    WHERE dni = '32123456' AND equipo_id = v_equipo_v51 LIMIT 1;

  IF v_reg_morales IS NOT NULL THEN
    INSERT INTO incidentes (
      registro_acceso_id, equipo_id, locacion_id,
      dni_afectado, nombre_afectado, empresa_afectado, funcion_afectado,
      descripcion, tipo, gravedad, dias_perdidos,
      informo_jefe_turno, jefe_turno_nombre,
      estado, fecha_incidente
    ) VALUES (
      v_reg_morales, v_equipo_v51, v_loc_aab,
      '29012345', 'Morales Castro, Gustavo', 'Calfrac Well Services', 'Operador de Equipos Pesados',
      'Contusión en mano derecha al operar válvula de alta presión del equipo de fractura. Primeros auxilios en sitio, derivado a médico de guardia.',
      'lesion', 'moderado', 2,
      true, 'Ing. Ramírez, Pablo',
      'investigando', NOW() - INTERVAL '10 days'
    ) ON CONFLICT DO NOTHING;
  END IF;

  IF v_reg_aguirre IS NOT NULL THEN
    INSERT INTO incidentes (
      registro_acceso_id, equipo_id, locacion_id,
      dni_afectado, nombre_afectado, empresa_afectado, funcion_afectado,
      descripcion, tipo, gravedad, dias_perdidos,
      informo_jefe_turno, jefe_turno_nombre,
      estado, fecha_incidente
    ) VALUES (
      v_reg_aguirre, v_equipo_v51, v_loc_aab,
      '32123456', 'Aguirre Ríos, Federico', 'Baker Hughes', 'Técnico de Directional Drilling',
      'Casi accidente: sarta de perforación cayó parcialmente durante conexión. Sin lesionados. Riesgo grave para el personal de piso. Se detuvo la operación y se realizó reunión de seguridad.',
      'casi_accidente', 'moderado', 0,
      true, 'Ing. Ramírez, Pablo',
      'pendiente', NOW() - INTERVAL '12 days'
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- Incidente histórico cerrado (hace 20 días) — para que el IF y IG tengan datos
  INSERT INTO incidentes (
    registro_acceso_id, equipo_id, locacion_id,
    dni_afectado, nombre_afectado, empresa_afectado, funcion_afectado,
    descripcion, tipo, gravedad, dias_perdidos,
    informo_jefe_turno, jefe_turno_nombre,
    estado, conclusion_investigacion, acciones_correctivas,
    investigado_por, fecha_cierre, fecha_incidente
  )
  SELECT
    (SELECT id FROM registros_acceso WHERE equipo_id = v_equipo_v10 LIMIT 1),
    v_equipo_v10, v_loc_can,
    '22678901', 'Vargas Ibáñez, Cristian', 'Weatherford Argentina', 'Técnico de Pesca',
    'Golpe en rodilla derecha al bajar del equipo. Atendido en enfermería del campamento. Sin días perdidos.',
    'lesion', 'leve', 0,
    true, 'Lic. Gómez, Adriana',
    'cerrado',
    'Causa raíz: escalón del equipo sin antideslizante. Personal atendido y dado de alta.',
    'Se instalaron cintas antideslizantes en todos los accesos. Capacitación de seguridad al personal.',
    v_admin_id, NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '20 days'
  WHERE EXISTS (SELECT 1 FROM registros_acceso WHERE equipo_id = v_equipo_v10 LIMIT 1)
  ON CONFLICT DO NOTHING;

END $$;

-- ── DOCUMENTOS DE SEGURIDAD ───────────────────────────────────────────────────
INSERT INTO documentos_seguridad (empresa_id, dni_titular, nombre_titular, tipo, nombre_documento, numero_documento, fecha_emision, fecha_vencimiento, nivel_alerta, bloqueante) VALUES
  -- Venver — documentos vigentes
  ('11111111-0000-0000-0000-000000000001', '35127890', 'Martínez González, Sebastián',  'ATS',              'ATS Fractura Hidráulica',      'ATS-2024-0891', '2024-01-15', '2026-01-15', 'warning', false),
  ('11111111-0000-0000-0000-000000000001', '27345678', 'Rodríguez Pérez, Alejandro',    'Induccion',        'Inducción SSO Venver 2024',    'IND-2024-0234', '2024-03-01', '2025-03-01', 'warning', false),
  ('11111111-0000-0000-0000-000000000001', '30456789', 'López Fernández, Carlos',       'Certificacion_ART','Certificación ART Galeno',     'ART-2024-1123', '2024-01-01', '2025-01-01', 'warning', true),
  ('11111111-0000-0000-0000-000000000001', '33567890', 'García Suárez, Pablo',          'Habilitacion',     'Habilitación Operador Grúa',   'HAB-2023-0456', '2023-06-01', '2025-06-01', 'warning', false),
  -- Próximos a vencer (menos de 30 días)
  ('11111111-0000-0000-0000-000000000001', '28678901', 'Sánchez Torres, Diego',         'Induccion',        'Inducción SSO Venver 2023',    'IND-2023-0567', '2023-05-01', CURRENT_DATE + INTERVAL '15 days', 'warning', false),
  ('11111111-0000-0000-0000-000000000001', '31789012', 'Romero Díaz, Facundo',          'Certificacion_ART','Certificación ART SMG',        'ART-2023-0789', '2023-05-01', CURRENT_DATE + INTERVAL '8 days',  'danger',  true),
  -- Vencidos
  ('11111111-0000-0000-0000-000000000001', '25890123', 'Flores Medina, Ramiro',         'ATS',              'ATS Workover',                 'ATS-2023-0234', '2023-01-01', CURRENT_DATE - INTERVAL '5 days',  'danger',  true),
  ('11111111-0000-0000-0000-000000000001', '36901234', 'Herrera Vega, Nicolás',         'Permiso_Trabajo',  'Permiso Trabajo en Altura',    'PTA-2023-0123', '2023-02-01', CURRENT_DATE - INTERVAL '30 days', 'danger',  false),
  -- PAE
  ('11111111-0000-0000-0000-000000000003', '26234567', 'Pereyra Núñez, Lucía',          'Induccion',        'Inducción PAE 2024',           'IND-PAE-0891',  '2024-02-01', '2026-02-01', 'warning', false),
  ('11111111-0000-0000-0000-000000000003', '38345678', 'Fernández López, Roberto',      'Certificacion_ART','Certificación ART Provincia',  'ART-PAE-0234',  '2024-01-01', '2025-01-01', 'warning', true)
ON CONFLICT (dni_titular, tipo, empresa_id) DO UPDATE SET
  nombre_documento = EXCLUDED.nombre_documento,
  fecha_vencimiento = EXCLUDED.fecha_vencimiento,
  nivel_alerta = EXCLUDED.nivel_alerta;

-- ── MÉTRICAS DIARIAS — últimos 30 días ───────────────────────────────────────
-- Generadas para V51 y Venver 10 para que los gráficos tengan datos
INSERT INTO metricas_diarias (equipo_id, fecha, total_ingresos, total_egresos, horas_hombre_total, promedio_permanencia_minutos, empresas_distintas, total_incidentes, incidentes_lesion, incidentes_accidente, incidentes_casi_accidente, dias_sin_incidente, indice_frecuencia, indice_gravedad)
SELECT
  e.id,
  CURRENT_DATE - (n || ' days')::INTERVAL,
  (3 + floor(random() * 8))::int,
  (2 + floor(random() * 7))::int,
  (24 + floor(random() * 48))::numeric(10,2),
  (180 + floor(random() * 240))::int,
  (2 + floor(random() * 4))::int,
  CASE WHEN n IN (10, 12, 20) THEN 1 ELSE 0 END,
  CASE WHEN n = 10 THEN 1 ELSE 0 END,
  0,
  CASE WHEN n = 12 THEN 1 ELSE 0 END,
  CASE WHEN n < 10 THEN n ELSE 0 END,
  0.00, 0.00
FROM
  generate_series(1, 30) AS n,
  (SELECT id FROM equipos WHERE id IN (
    '33333333-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000010',
    '33333333-0000-0000-0000-000000000011'
  )) AS e
ON CONFLICT (equipo_id, fecha) DO UPDATE SET
  total_ingresos = EXCLUDED.total_ingresos,
  total_egresos = EXCLUDED.total_egresos,
  horas_hombre_total = EXCLUDED.horas_hombre_total,
  total_incidentes = EXCLUDED.total_incidentes,
  incidentes_lesion = EXCLUDED.incidentes_lesion,
  incidentes_casi_accidente = EXCLUDED.incidentes_casi_accidente;

-- Recalcular índices donde hay horas hombre
UPDATE metricas_diarias SET
  indice_frecuencia = CASE WHEN horas_hombre_total > 0 THEN ROUND((incidentes_lesion::numeric / horas_hombre_total) * 200000, 4) ELSE 0 END,
  indice_gravedad   = 0  -- días perdidos se calculan desde tabla incidentes
WHERE equipo_id IN (
  '33333333-0000-0000-0000-000000000001',
  '33333333-0000-0000-0000-000000000002'
);

-- ── ASIGNAR OPERADORES A EQUIPOS ──────────────────────────────────────────────
UPDATE equipos SET operador_asignado_id = (
  SELECT id FROM usuarios WHERE email = 'operador.v51@venver.com.ar' LIMIT 1
) WHERE id = '33333333-0000-0000-0000-000000000001' AND EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'operador.v51@venver.com.ar'
);

UPDATE equipos SET operador_asignado_id = (
  SELECT id FROM usuarios WHERE email = 'operador.v10@venver.com.ar' LIMIT 1
) WHERE id = '33333333-0000-0000-0000-000000000002' AND EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'operador.v10@venver.com.ar'
);

-- ── PERMISO YPF → VENVER (para que el auditor vea datos) ─────────────────────
INSERT INTO permisos_acceso (empresa_propietaria_id, empresa_auditora_id, equipo_id, tipo_acceso, puede_ver_incidentes, puede_ver_hse, puede_ver_coordenadas, fecha_inicio, activo)
VALUES
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001', 'lectura_en_vivo', true, true, false, CURRENT_DATE, true),
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'lectura_en_vivo', true, true, false, CURRENT_DATE, true)
ON CONFLICT (empresa_propietaria_id, empresa_auditora_id, equipo_id) DO UPDATE SET activo = true;

-- ── RESUMEN ───────────────────────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM empresas)                                    AS empresas,
  (SELECT COUNT(*) FROM equipos WHERE deleted_at IS NULL)            AS equipos,
  (SELECT COUNT(*) FROM registros_acceso WHERE deleted_at IS NULL)   AS registros,
  (SELECT COUNT(*) FROM registros_acceso WHERE estado = 'dentro')    AS dentro_ahora,
  (SELECT COUNT(*) FROM incidentes)                                  AS incidentes,
  (SELECT COUNT(*) FROM documentos_seguridad)                        AS documentos,
  (SELECT COUNT(*) FROM metricas_diarias)                            AS metricas,
  (SELECT COUNT(*) FROM permisos_acceso WHERE activo = true)         AS permisos_activos;

-- Re-habilitar triggers
ALTER TABLE equipos ENABLE TRIGGER trg_log_ubicacion_equipo;
ALTER TABLE registros_acceso ENABLE TRIGGER trg_log_registros;
ALTER TABLE registros_acceso ENABLE TRIGGER trg_metricas_on_registro;
ALTER TABLE incidentes ENABLE TRIGGER trg_metricas_on_incidente;
ALTER TABLE incidentes ENABLE TRIGGER trg_notify_incidente;
