# CLAUDE.md — FieldPass

> Última actualización: Mayo 2026 — Kiro
> Leer este archivo completo antes de tocar cualquier código.

---

## Estado del proyecto

### ✅ Implementado y funcional

**Base / Infraestructura**
- Auth completo con Supabase + Zustand store (persistencia, rehidratación, guards por rol)
- Router con guards por rol: operador, admin, auditor, superadmin
- Offline store + sync queue (localStorage via Zustand, hasta 200 registros)
- PWA con Service Worker (vite-plugin-pwa) — app carga sin internet después del primer uso
- Realtime subscriptions (Supabase channels)
- Tema claro/oscuro (ThemeToggle)
- Recuperar contraseña (`/recover`) via Supabase resetPasswordForEmail

**Operador (mobile-first / tablet)**
- `OperadorHome` — lista personas dentro, búsqueda, stats rápidos
- `NuevoIngreso` — flujo 4 pasos: DNI → datos → firma → éxito, autocomplete historial, GPS guardado
- `MarcarSalida` — búsqueda por lista o numpad DNI, declaración con resumen del registro (replica formulario físico Venver), auto-navigate
- `ConfigEquipo` — setear coordenadas GPS del equipo desde la tablet
- `DeclaracionIncidente` — muestra resumen completo del registro + columnas NO/SÍ con texto exacto del formulario físico
- `FormIncidente` — detalle del incidente con firma del jefe de turno
- `FirmaCanvas` — pad de firma SVG reutilizable
- Egreso funciona offline (encola en localStorage, sync al reconectar)

**Admin (desktop)**
- `AdminDashboard` — KPIs en tiempo real filtrados por empresa + actividad reciente
- `Registros` — tabla 7 días default, filtros, exportar Excel, descargar PDF por registro
- `Incidentes` — lista con filtros de estado, modal para cerrar investigación
- `MapaEquipos` — Leaflet con pins coloreados, panel lateral con personas dentro real
- `EstadisticasHSE` — IF, IG real (días perdidos de tabla incidentes), días sin lesión
- `Estadisticas` — operacional: ingresos, HH, top empresas, gráficos
- `GestionEquipos` — CRUD completo con modal, filtros, asignación locación/operador
- `GestionLocaciones` — CRUD con coordenadas GPS, toggle activa/inactiva
- `GestionUsuarios` — invitación real via Edge Function, link de activación como fallback
- `GestionEmpresas` — empresas visitantes habituales
- `Auditores` — permisos de acceso para operadoras (YPF, etc.)
- `Documentos` — ATS, inducciones, certificaciones con alertas de vencimiento
- `Logs` — historial de auditoría filtrado por empresa

**Auditor (desktop, solo lectura)**
- `AuditorDashboard` — KPIs + equipos autorizados via permisos_acceso con fecha_fin check
- `MapaAuditor` — coordenadas degradadas ±500m, personas_dentro real (estado='dentro')
- `IncidentesAuditor` — solo equipos con permiso puede_ver_incidentes
- `ReportesAuditor` — exportar CSV filtrado por permisos autorizados

**Superadmin (plataforma completa)**
- `SuperadminDashboard` — KPIs globales + empresas recientes
- `GestionEmpresas` — CRUD contratistas y operadoras con plan
- `GestionUsuarios` — todos los usuarios con filtros por empresa/rol
- `PermisosAcceso` — modelo multi-tenant: qué contratista comparte con qué operadora
- `MetricasPlataforma` — gráficos globales: registros/día, incidentes/mes, distribuciones
- `ConfiguracionPlataforma` — ver env vars, feature flags, estado de Supabase
- `SoportePlataforma` — health check DB/Auth/Realtime, actividad por empresa
- `LogsGlobales` — logs de toda la plataforma con filtros y exportar CSV

**Componentes compartidos**
- `SupportButton` — WhatsApp + Email, variant fab (tablet) y icon (desktop)
- `RegistroPDF` — replica exacta del formulario físico de Venver con firmas
- `EquiposMap` — mapa Leaflet reutilizable, íconos locales (funciona offline)
- Design system completo: Button, Card, Badge, Input, Select, Modal, Table, Skeleton, StatusDot, Logo

**Edge Functions (deployadas en Supabase)**
- `invite-user` — crea usuario en auth.users + tabla usuarios, envía email via Resend, fallback con link de activación
- `alert-incidente` — email HTML al admin cuando hay incidente, via Resend API

**Infraestructura / DevOps**
- Migraciones SQL completas (001–007) en `supabase/migrations/`
- SMTP configurado: Resend (smtp.resend.com:465)
- Secrets en Supabase: RESEND_API_KEY, SITE_URL
- PWA: Service Worker con precache de assets, NetworkFirst para Supabase API, CacheFirst para tiles OSM (500 tiles, 30 días)
- Code splitting: leaflet, recharts, xlsx, react, supabase en chunks separados
- Leaflet icons locales en `/public/icons/` (funciona offline)

### ⚠️ Pendiente

- **Email de invitación** — funciona pero llega desde `onboarding@resend.dev`. Para que llegue desde dominio propio: verificar dominio en Resend → actualizar sender en Edge Function → redeploy
- **Geofence** — feature flag `VITE_FEATURE_GEOFENCE=false`. Hook `useGeofence.ts` no implementado
- **EmergencyPanel** — feature flag `VITE_FEATURE_EMERGENCIA=true`. Componente no implementado
- **Impersonar empresa** — UI lista en SoportePlataforma, Edge Function pendiente
- **Paginación en Registros** — límite actual 500 filas
- **`@react-pdf/renderer`** — instalado, `RegistroPDF.tsx` creado, pero no testeado en build de Vercel (puede requerir ajustes de SSR)

### 👥 Usuarios de prueba (Mayo 2026)

| Email | Password | Rol | Empresa |
|-------|----------|-----|---------|
| welllogsupport@gmail.com | $uperAdmin | superadmin | Venver |
| admin@venver.com.ar | Admin#Venver1 | admin | Venver |
| operador.v51@venver.com.ar | Op#V51campo | operador | Venver |
| operador.v10@venver.com.ar | Op#V10campo | operador | Venver |
| auditor@ypf.com | Audit#YPF1 | auditor | YPF |

**Pendiente para que los operadores funcionen:**
- Asignar `operador.v51` al equipo VS1 desde `/admin/equipos`
- Asignar `operador.v10` al equipo Venver 10 desde `/admin/equipos`
- Crear permiso para YPF desde `/admin/auditores` (para que el auditor vea datos)

### 🐛 Bugs corregidos (Mayo 2026 — sesión 3, Kiro)

**Problema raíz: páginas vacías o que nunca terminan de cargar**
- Dashboard vacío, Equipos/Auditores/Empresas/Documentos/Logs nunca terminaban de cargar
- Causa: combinación de `autoRefreshToken: false` (tokens expiraban sin renovarse), queries sin `enabled` guard (se disparaban antes de tener sesión), y retry config que mataba permanentemente queries con cualquier error PGRST

**Fixes aplicados:**
- `supabase.ts` — `autoRefreshToken: true` (antes `false`). Supabase ahora renueva tokens automáticamente
- `useAuth.ts` — simplificado: ya no hace `refreshSession()` manual (Supabase lo maneja). Agregado handler para `TOKEN_REFRESHED && !session` (token expiró irrecuperablemente)
- `queryClient.ts` — retry logic más granular: solo mata queries en 401/JWT, 403, PGRST116 (not found), PGRST200/204 (schema errors). Otros errores PGRST ahora reintentan 2 veces
- `useEmpresas.ts` — `useTodasEmpresas`, `useContratistas`, `useOperadoras`, `usePermisosAcceso` ahora tienen `enabled: !!usuario`
- `Documentos.tsx` — `useDocumentos()` ahora tiene `enabled: !!empresaId` (antes se disparaba con `empresaId!` = undefined)
- `GestionEmpresas.tsx` — `useEmpresasVisitantes()` ahora tiene `enabled: !!empresaId && !!usuario` + error handling graceful
- `useEquipos.ts` — `useEquipos()` ahora tiene fallback: si el join con `operador` falla (FK no existe), reintenta sin ese join
- `useIncidentes.ts` — removido `!inner` join que causaba 0 resultados si el FK fallaba. Ahora usa two-step: primero obtiene equipoIds, luego filtra con `.in()`
- `Logs.tsx` — `useLogsAdmin()` ahora tiene fallback si el join con `usuarios` falla + error handling en la primera query
- `AdminDashboard.tsx` — query keys de KPIs ahora incluyen `equipoIds` para invalidación correcta

### ✨ Mejoras (Mayo 2026 — sesión 3, Kiro)

**Performance — Lazy Loading (reducción 97.8% bundle inicial)**
- `router.tsx` — todas las vistas cargan con `React.lazy()` + `Suspense`. Bundle inicial: 38KB (antes 1,750KB)
- `Registros.tsx` — `xlsx` y `@react-pdf/renderer` se importan dinámicamente solo al exportar/descargar
- Cada vista es un chunk independiente (~5-10KB cada uno)

**Resiliencia — Error Boundary**
- `ErrorBoundary.tsx` — detecta errores de chunk (nueva versión desplegada) y errores genéricos
- Muestra botón "Recargar" para chunk errors, "Reintentar" para otros
- Integrado en `App.tsx` envolviendo el `RouterProvider`

**UX — Drawer de detalle de registro**
- `Drawer.tsx` — componente panel lateral reutilizable con animación slide-in-right
- `RegistroDetalle.tsx` — drawer completo con: datos personales, tiempos, firmas (miniaturas), declaración de incidente, GPS, auditoría
- Click en cualquier fila de Registros abre el drawer
- Botón ojo (ver detalle) + botón PDF (descargar) en cada fila

### 🐛 Bugs corregidos (Mayo 2026 — sesión 1)

- `useEquipos` / `useEquiposConPersonas` — ahora filtran por `empresa_contratista_id` del usuario logueado
- `useRegistrosAdmin` — reemplazado JOIN silencioso por two-step query correcta
- `useLocaciones` — ahora filtra por `empresa_id` del usuario logueado
- `useCrearLocacion` — ahora incluye `empresa_id` en el insert
- `useCrearEquipo` — ahora incluye `empresa_contratista_id` en el insert
- `useTodosUsuarios` — ahora filtra por empresa para admin/supervisor; superadmin ve todos
- `useRealtimeEquipo` — query key corregido a `['registros', 'dentro', equipoId]`
- `GestionEmpresas` (admin) — excluye la propia empresa del listado de visitantes

### 🐛 Bugs corregidos (Mayo 2026 — sesión 2)

- `useIncidentes` — ahora filtra por empresa del usuario (evita data leak entre tenants)
- `useIncidentesPendientes` — ahora filtra por equipos de la empresa
- `useNuevoIngreso` — GPS ahora se guarda en `ubicacion_ingreso` en la DB
- `MarcarSalida` — auto-navigate al inicio en el caso sin incidente (estaba faltando)
- `MapaEquipos` panel — `personas_dentro` ya no muestra `—` hardcodeado
- `MapaAuditor` — `personas_dentro` filtra solo `estado='dentro'`; permisos verifican `fecha_fin`
- `IncidentesAuditor` — import de `useAuthStore` faltante agregado; filtro por permisos
- `ReportesAuditor` — `revokeObjectURL` con delay; filtro por permisos
- `AuditorDashboard` — ahora consulta `permisos_acceso` para mostrar solo equipos autorizados
- `EstadisticasHSE` — IG calcula `dias_perdidos` reales desde `incidentes`; días sin incidente cuenta solo lesiones
- `AdminDashboard` — query de recientes ya no trae firmas base64
- `Registros` — default de fechas últimos 7 días; import muerto `Filter` removido
- `EquiposMap` — import muerto `Link` removido; `AutoCenter` detecta cambios de coordenadas reales
- `OperadorHome` — import muerto `useAuth` removido
- `DNIInput` — `disabled` como atributo HTML en botón ✓; `handleKeyboard` no bloquea Tab/Escape
- `DebugPanel` — protegido: solo dev o superadmin; queries en paralelo
- `Logo` — gradient id usa `useId()` para evitar colisiones
- `Button` — `type="button"` por defecto; `active:scale-98` funcional
- `tailwind.config.js` — `scale-98` agregado; sombras actualizadas
- `vite.config.ts` — code splitting para leaflet, recharts, xlsx, react, supabase
- `index.css` — variables modo claro con más contraste; `card-clay` con `border: 1px`
- `Sidebar` — grupos con separadores; iconos más pequeños; colores consistentes

---

## ¿Qué es este proyecto?

**FieldPass** es un SaaS B2B multi-tenant para control de acceso en yacimientos petroleros e instalaciones industriales. Digitaliza las planillas físicas de ingreso/egreso de personal (como el "Registro de Visita al Equipo" de Venver), permitiendo monitoreo en tiempo real, trazabilidad geoespacial, métricas HSE y auditoría legal.

### Actores del sistema

| Actor | Rol en el negocio | Acceso |
|-------|-------------------|--------|
| **Venver** | Empresa contratista. Es el cliente que compra el SaaS. Administra sus equipos y personal. | Admin total sobre sus datos |
| **Operador** | Guardia/encargado en la tranquera del equipo. Usa una tablet en campo. | Solo su equipo asignado |
| **YPF / Operadora** | Empresa dueña del área. Audita lo que pasa en los equipos que contrató a Venver. | Solo lectura, solo equipos autorizados |

### Origen del formulario físico

El formulario base se tomó del **"Registro de Visita al Equipo"** de Venver (planilla en papel). Contiene: Equipo N°, Locación, Apellido/Nombre, Empresa/Entidad, Función, Motivo de visita, Hora de llegada, Firma de ingreso, Hora de salida, y la **Declaración de Incidente** (columna NO / columna SÍ con firma antes de salir). Todo el modelo de datos parte de replicar exactamente este formulario y mejorarlo.

---

## Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | React 18 + TypeScript + Vite | Monorepo único |
| Estilos | Tailwind CSS v3 | ClayUI style: limpio, blanco, minimalista |
| Estado UI | Zustand | Para estado de UI, mapa, offline queue |
| Estado servidor | TanStack Query v5 | Caché, sync, invalidaciones en cascada |
| DB + Auth + Storage | Supabase | PostgreSQL + Auth + Realtime + Storage |
| Geodatos | PostGIS (extension en Supabase) | Índices espaciales, geofences, distancias |
| Mapas | Leaflet + react-leaflet | MVP libre. Migrar a Mapbox cuando escale |
| Offline | Workbox + IndexedDB | Service Workers para tablet sin señal |
| Firmas | react-signature-pad | Canvas SVG, guardado como base64 |
| Gráficos | Recharts | Responsive, composable |
| Exportación | xlsx + papaparse | Excel y CSV generados en el frontend |
| QR | qrcode.react + jsqr | Generación y lectura (feature flag) |
| Notificaciones UI | react-hot-toast | Toasts, no push notifications |
| Reportes PDF | @react-pdf/renderer | Generación de informes HSE en cliente |
| Deploy | Vercel | Frontend + Edge Functions si se necesita |

---

## Estructura de Carpetas

```
fieldpass/
├── CLAUDE.md                        ← Este archivo. Leerlo siempre primero.
├── .env.local                       ← Variables de entorno (NUNCA commitear)
├── .env.example                     ← Plantilla pública sin valores reales
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
│
├── public/
│   ├── manifest.json                ← PWA manifest (instalar en tablet)
│   ├── sw.js                        ← Service Worker entry point
│   └── icons/                       ← PWA icons (72, 96, 128, 144, 192, 512px)
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_extensions.sql       ← Habilitar PostGIS y pgcrypto
│   │   ├── 002_schema_base.sql      ← Tablas principales
│   │   ├── 003_schema_hse.sql       ← Tablas HSE: incidentes, locaciones
│   │   ├── 004_rls_policies.sql     ← Row Level Security completo
│   │   ├── 005_functions.sql        ← Funciones PL/pgSQL
│   │   ├── 006_triggers.sql         ← Triggers: updated_at, logs, métricas, alertas
│   │   └── 007_seed.sql             ← Datos de prueba (no correr en producción)
│   ├── functions/
│   │   ├── alert-incidente/         ← Edge Function: push alert al admin
│   │   └── generate-report-hse/     ← Edge Function: PDF HSE mensual
│   └── config.toml
│
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── router.tsx                   ← React Router v6 con guards por rol
    │
    ├── types/
    │   ├── database.types.ts        ← Generado por Supabase CLI (no editar a mano)
    │   ├── models.ts                ← Tipos de negocio derivados de database.types
    │   └── roles.ts                 ← Enums de roles, permisos, feature flags
    │
    ├── lib/
    │   ├── supabase.ts              ← Cliente Supabase singleton
    │   ├── queryClient.ts           ← TanStack Query config + retry logic
    │   └── workbox.ts               ← Offline sync config + estrategias de caché
    │
    ├── stores/
    │   ├── authStore.ts             ← Usuario activo, rol, empresa_id, equipo_id
    │   ├── offlineStore.ts          ← Cola IndexedDB, estado de sync, errores
    │   └── mapStore.ts              ← Equipo seleccionado, zoom, filtros activos
    │
    ├── hooks/
    │   ├── useAuth.ts               ← Sesión, rol, permisos, logout
    │   ├── useGPS.ts                ← Captura lat/lon + precisión, manejo de errores
    │   ├── useGeofence.ts           ← Validar si la tablet está en zona del equipo
    │   ├── useEquipos.ts            ← CRUD equipos + asignación de locación
    │   ├── useLocaciones.ts         ← CRUD locaciones
    │   ├── useRegistros.ts          ← Ingresos/egresos, búsqueda por DNI
    │   ├── useIncidentes.ts         ← Declaraciones de incidente, métricas HSE
    │   ├── useMetricas.ts           ← Stats, índices IF/IG, horas hombre
    │   ├── useRealtime.ts           ← Subscripciones Supabase Realtime (.channel())
    │   └── useOfflineSync.ts        ← Cola offline + sincronización automática
    │
    ├── components/
    │   ├── ui/                      ← Design system base (ClayUI style)
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Input.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Drawer.tsx
    │   │   ├── Table.tsx
    │   │   ├── Select.tsx
    │   │   ├── Toast.tsx
    │   │   ├── Skeleton.tsx
    │   │   └── StatusDot.tsx
    │   │
    │   ├── layout/
    │   │   ├── Sidebar.tsx
    │   │   ├── TopBar.tsx
    │   │   ├── PageLayout.tsx       ← Admin/Auditor (desktop-first)
    │   │   └── TabletLayout.tsx     ← Operador (mobile-first, sin sidebar)
    │   │
    │   ├── map/
    │   │   ├── EquiposMap.tsx       ← Mapa principal con todos los equipos/locaciones
    │   │   ├── EquipoPin.tsx        ← Pin con personas dentro + color de estado
    │   │   ├── EquipoPanel.tsx      ← Panel lateral al seleccionar un equipo
    │   │   ├── GeofenceLayer.tsx    ← Polígonos de zonas de seguridad
    │   │   ├── MapSearch.tsx        ← Buscador por nombre de equipo o locación
    │   │   └── CoordPicker.tsx      ← Selector de coordenadas para operador
    │   │
    │   ├── registro/
    │   │   ├── FormIngreso.tsx          ← Formulario de nuevo ingreso
    │   │   ├── FormSalida.tsx           ← Marcar egreso + declaración incidente
    │   │   ├── DeclaracionIncidente.tsx ← Pantalla columna NO / columna SÍ con firmas
    │   │   ├── FormIncidente.tsx        ← Detalle del incidente si elige SÍ
    │   │   ├── FirmaCanvas.tsx          ← Pad de firma SVG reutilizable
    │   │   ├── DNIInput.tsx             ← Input numérico grande para tablet
    │   │   ├── AutocompleteDNI.tsx      ← Autocomplete con historial de visitas previas
    │   │   └── QRScanner.tsx            ← Escáner QR para egreso rápido (feature flag)
    │   │
    │   ├── hse/
    │   │   ├── IndicesHSE.tsx           ← Tarjetas IF, IG, días sin incidentes
    │   │   ├── IncidenteCard.tsx        ← Resumen visual de un incidente
    │   │   ├── IncidentesList.tsx       ← Tabla de incidentes con filtros
    │   │   └── AlertaDocVencida.tsx     ← Alerta de documentación vencida
    │   │
    │   ├── stats/
    │   │   ├── HorasHombreChart.tsx
    │   │   ├── IngresosPorHoraChart.tsx
    │   │   ├── EmpresasDistChart.tsx
    │   │   ├── IncidentesTendenciaChart.tsx
    │   │   └── TendenciaChart.tsx
    │   │
    │   └── shared/
    │       ├── OfflineBanner.tsx        ← "Sin conexión — X registros en cola"
    │       └── EmergencyPanel.tsx       ← Lista de evacuación en modo emergencia
    │
    └── views/
        ├── auth/
        │   ├── LoginView.tsx
        │   └── RecoverPasswordView.tsx
        │
        ├── operador/                ← Mobile-first, sin navbar lateral
        │   ├── OperadorHome.tsx         ← Lista "dentro" + botones principales
        │   ├── NuevoIngreso.tsx         ← Flujo completo de ingreso
        │   ├── MarcarSalida.tsx         ← Flujo egreso + declaración incidente
        │   └── ConfigEquipo.tsx         ← Setear coordenadas del equipo desde tablet
        │
        ├── admin/                   ← Desktop, sidebar completo
        │   ├── AdminDashboard.tsx       ← KPIs + resumen de todos los equipos
        │   ├── MapaEquipos.tsx          ← Mapa interactivo con todos los equipos
        │   ├── GestionEquipos.tsx       ← CRUD equipos + asignación de locación
        │   ├── GestionLocaciones.tsx    ← CRUD locaciones (AAB 1012, etc.)
        │   ├── GestionUsuarios.tsx      ← CRUD operadores
        │   ├── GestionEmpresas.tsx      ← Empresas visitantes habituales
        │   ├── Registros.tsx            ← Tabla completa con búsqueda y filtros
        │   ├── Incidentes.tsx           ← Gestión de declaraciones e investigaciones
        │   ├── EstadisticasHSE.tsx      ← Dashboard HSE: IF, IG, tendencias
        │   ├── Estadisticas.tsx         ← Dashboard operacional: horas hombre, etc.
        │   ├── Documentos.tsx           ← ATS, Inducciones, permisos y vencimientos
        │   ├── Auditores.tsx            ← Gestionar acceso YPF
        │   └── Logs.tsx                 ← Historial de auditoría del sistema
        │
        └── auditor/                 ← Solo lectura, desktop
            ├── AuditorDashboard.tsx     ← Resumen en tiempo real
            ├── MapaAuditor.tsx          ← Mapa (coordenadas con precisión degradada)
            ├── IncidentesAuditor.tsx    ← Ver incidentes de equipos autorizados
            └── ReportesAuditor.tsx      ← Exportar registros autorizados
```

---

## Variables de Entorno

```bash
# .env.local — NO commitear nunca

# Supabase (público, va al frontend)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mapas (MVP: Leaflet + OpenStreetMap, sin costo)
# VITE_MAPBOX_TOKEN=pk.eyJ1...  ← Descomentar cuando se migre a Mapbox

# App
VITE_APP_NAME=FieldPass
VITE_APP_URL=https://fieldpass.vercel.app
VITE_OFFLINE_SYNC_INTERVAL_MS=30000
VITE_MAX_OFFLINE_QUEUE=200
VITE_GEOFENCE_WARN_DISTANCE_KM=2

# Feature Flags (true/false)
VITE_FEATURE_QR=false
VITE_FEATURE_CAMERA=false
VITE_FEATURE_GEOFENCE=false
VITE_FEATURE_EMERGENCIA=true
VITE_FEATURE_HSE_INDICES=true

# Solo backend/CLI (NUNCA exponer en el frontend ni commitear)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_URL=postgresql://postgres:pass@db.xxxx.supabase.co:5432/postgres
```

---

## Base de Datos — Schema Completo

### Extensiones requeridas

```sql
-- 001_extensions.sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Tablas

```sql
-- ─────────────────────────────────────────────────────
-- EMPRESAS
-- ─────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────
-- USUARIOS
-- ─────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────
-- LOCACIONES
-- Entidad DISTINTA al equipo. Ej: "AAB 1012"
-- Un equipo opera EN una locación.
-- ─────────────────────────────────────────────────────
CREATE TABLE locaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id),
  codigo          VARCHAR(50) NOT NULL,       -- "AAB 1012"
  nombre          VARCHAR(255),
  descripcion     TEXT,
  ubicacion_punto GEOMETRY(Point, 4326),      -- Coordenadas GPS
  activa          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

-- ─────────────────────────────────────────────────────
-- EQUIPOS
-- Ej: "VS1", "Venver 10". Opera en una locación.
-- ─────────────────────────────────────────────────────
CREATE TABLE equipos (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_contratista_id       UUID NOT NULL REFERENCES empresas(id),
  empresa_operadora_id         UUID REFERENCES empresas(id),
  locacion_actual_id           UUID REFERENCES locaciones(id),
  nombre_equipo                VARCHAR(255) NOT NULL,    -- "VS1", "Venver 10"
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

-- ─────────────────────────────────────────────────────
-- HISTORIAL DE UBICACIONES DE EQUIPOS
-- ─────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────
-- REGISTROS DE ACCESO (Core)
-- Replica exactamente el formulario físico de Venver
-- ─────────────────────────────────────────────────────
CREATE TABLE registros_acceso (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id                    UUID NOT NULL REFERENCES equipos(id),
  locacion_id                  UUID REFERENCES locaciones(id),
  empresa_visitante_id         UUID REFERENCES empresas(id),
  empresa_visitante_nombre     VARCHAR(255),          -- Para visitantes no registrados

  -- Datos del formulario físico
  tipo_documento               TEXT DEFAULT 'DNI' CHECK (tipo_documento IN ('DNI', 'Pasaporte', 'LC', 'LE')),
  dni                          VARCHAR(20) NOT NULL,
  nombre_completo              VARCHAR(255) NOT NULL,
  funcion_visitante            VARCHAR(255),          -- "Técnico de Campo" — del formulario físico
  motivo_visita                VARCHAR(255) NOT NULL,
  vehiculo_patente             VARCHAR(20),

  -- Timestamps (generados por el servidor, nunca por el cliente)
  fecha_ingreso                TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_egreso                 TIMESTAMPTZ,

  -- Firmas de ingreso
  firma_ingreso_storage_path   TEXT,                  -- Path en Supabase Storage (preferido)
  firma_ingreso_data           TEXT,                  -- Base64 fallback para sync offline

  -- Firmas de egreso
  firma_egreso_storage_path    TEXT,
  firma_egreso_data            TEXT,

  -- DECLARACIÓN DE INCIDENTE — columna NO / SÍ del formulario físico
  -- NULL = aún no completó la declaración (egreso pendiente)
  -- FALSE = firmó columna NO (sin incidente)
  -- TRUE  = firmó columna SÍ (hubo incidente → genera registro en tabla incidentes)
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

-- ─────────────────────────────────────────────────────
-- INCIDENTES
-- Se crea cuando declara_incidente = TRUE al egreso
-- ─────────────────────────────────────────────────────
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
  dias_perdidos            INTEGER DEFAULT 0,   -- Para cálculo del Índice de Gravedad

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

-- ─────────────────────────────────────────────────────
-- DOCUMENTOS DE SEGURIDAD
-- ATS, Inducciones, Certificaciones con vencimiento
-- ─────────────────────────────────────────────────────
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
  archivo_path      TEXT,               -- Path en Supabase Storage
  nivel_alerta      TEXT DEFAULT 'warning' CHECK (nivel_alerta IN ('warning', 'danger')),
  -- warning → alerta amarilla, permite ingreso
  -- danger  → alerta roja, bloquea ingreso (requiere override de admin con log)
  bloqueante        BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dni_titular, tipo, empresa_id)
);

-- ─────────────────────────────────────────────────────
-- GEOFENCES
-- ─────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────
-- PERMISOS DE ACCESO
-- Qué equipos puede auditar cada empresa (YPF → Venver 10, Venver 22)
-- ─────────────────────────────────────────────────────
CREATE TABLE permisos_acceso (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_propietaria_id  UUID NOT NULL REFERENCES empresas(id),
  empresa_auditora_id     UUID NOT NULL REFERENCES empresas(id),
  equipo_id               UUID REFERENCES equipos(id),  -- NULL = todos los equipos
  tipo_acceso             TEXT DEFAULT 'lectura' CHECK (tipo_acceso IN (
    'lectura', 'lectura_en_vivo', 'reporte'
  )),
  puede_ver_incidentes    BOOLEAN DEFAULT FALSE,
  puede_ver_hse           BOOLEAN DEFAULT FALSE,
  puede_ver_coordenadas   BOOLEAN DEFAULT FALSE,  -- TRUE = ve coordenadas exactas
  fecha_inicio            DATE NOT NULL,
  fecha_fin               DATE,
  activo                  BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_propietaria_id, empresa_auditora_id, equipo_id)
);

-- ─────────────────────────────────────────────────────
-- MÉTRICAS DIARIAS (Desnormalizada para performance)
-- Actualizada por trigger en INSERT/UPDATE de registros_acceso e incidentes
-- ─────────────────────────────────────────────────────
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
  -- Índices estándar de la industria petrolera
  -- IF = (N° incidentes / Horas hombre) × 200.000
  -- IG = (Días perdidos / Horas hombre) × 200.000
  indice_frecuencia            NUMERIC(8,4),
  indice_gravedad              NUMERIC(8,4),
  created_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(equipo_id, fecha)
);

-- ─────────────────────────────────────────────────────
-- LOGS DE SISTEMA (Auditoría completa de acciones)
-- ─────────────────────────────────────────────────────
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
```

---

## RLS — Row Level Security

```sql
-- Habilitar en todas las tablas sin excepción
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

-- Helper functions (evitan repetir JOINs en cada policy)
CREATE OR REPLACE FUNCTION auth_empresa_id() RETURNS UUID AS $$
  SELECT empresa_id FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_rol() RETURNS TEXT AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── REGISTROS_ACCESO ──────────────────────────────────

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

-- Admin ve todos sus registros sin límite de fecha
CREATE POLICY "admin_select_sus_equipos"
  ON registros_acceso FOR SELECT USING (
    equipo_id IN (
      SELECT id FROM equipos WHERE empresa_contratista_id = auth_empresa_id()
    )
  );

CREATE POLICY "admin_update_sus_equipos"
  ON registros_acceso FOR UPDATE USING (
    equipo_id IN (
      SELECT id FROM equipos WHERE empresa_contratista_id = auth_empresa_id()
    )
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

CREATE POLICY "auditor_select_incidentes_autorizados"
  ON incidentes FOR SELECT USING (
    equipo_id IN (
      SELECT equipo_id FROM permisos_acceso
      WHERE empresa_auditora_id = auth_empresa_id()
        AND activo = TRUE
        AND puede_ver_incidentes = TRUE
    )
  );

-- ── EQUIPOS ───────────────────────────────────────────

CREATE POLICY "operador_select_su_equipo_asignado"
  ON equipos FOR SELECT USING (operador_asignado_id = auth.uid());

CREATE POLICY "admin_select_sus_equipos"
  ON equipos FOR SELECT USING (empresa_contratista_id = auth_empresa_id());

CREATE POLICY "auditor_select_equipos_autorizados"
  ON equipos FOR SELECT USING (
    id IN (
      SELECT equipo_id FROM permisos_acceso
      WHERE empresa_auditora_id = auth_empresa_id() AND activo = TRUE
    )
  );
```

---

## Triggers

```sql
-- updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_empresas_upd   BEFORE UPDATE ON empresas          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_equipos_upd    BEFORE UPDATE ON equipos           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_registros_upd  BEFORE UPDATE ON registros_acceso  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_incidentes_upd BEFORE UPDATE ON incidentes        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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

-- Alerta push cuando se declara un incidente
CREATE OR REPLACE FUNCTION notify_incidente()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/alert-incidente',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := jsonb_build_object('incidente_id', NEW.id, 'equipo_id', NEW.equipo_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_incidente
  AFTER INSERT ON incidentes
  FOR EACH ROW EXECUTE FUNCTION notify_incidente();
```

---

## Roles y Permisos

```typescript
// src/types/roles.ts
export type Rol = 'superadmin' | 'admin' | 'operador' | 'auditor' | 'supervisor'

export const PERMISOS = {
  superadmin: {
    ver_todos_los_datos:          true,
    editar_registros:             true,
    editar_registros_historicos:  true,
    eliminar_logico:              true,
    ver_mapa:                     true,
    exportar_coordenadas:         true,
    ver_firmas:                   true,
    gestionar_empresas:           true,
    gestionar_usuarios:           true,
    crear_auditores:              true,
    ver_incidentes:               true,
    cerrar_incidentes:            true,
    ver_logs:                     true,
    precision_mapa:               'exacta',
  },
  admin: {
    ver_todos_los_datos:          true,   // Solo sus equipos
    editar_registros:             true,
    editar_registros_historicos:  true,
    eliminar_logico:              true,   // Con log automático
    ver_mapa:                     true,
    exportar_coordenadas:         true,
    ver_firmas:                   true,
    gestionar_empresas:           false,
    gestionar_usuarios:           true,   // Solo operadores de su empresa
    crear_auditores:              true,
    ver_incidentes:               true,
    cerrar_incidentes:            true,
    ver_logs:                     true,
    precision_mapa:               'exacta',
  },
  operador: {
    ver_todos_los_datos:          false,  // Solo su equipo asignado
    editar_registros:             true,   // Solo registros del día actual
    editar_registros_historicos:  false,
    eliminar_logico:              false,
    ver_mapa:                     false,  // Solo el picker de coords de su equipo
    exportar_coordenadas:         false,
    ver_firmas:                   true,
    gestionar_empresas:           false,
    gestionar_usuarios:           false,
    crear_auditores:              false,
    ver_incidentes:               true,   // Solo los de su equipo (para completar flujo)
    cerrar_incidentes:            false,
    ver_logs:                     false,
    precision_mapa:               null,
  },
  auditor: {
    ver_todos_los_datos:          false,  // Solo equipos autorizados
    editar_registros:             false,
    editar_registros_historicos:  false,
    eliminar_logico:              false,
    ver_mapa:                     true,   // Con precisión degradada ±500m
    exportar_coordenadas:         false,
    ver_firmas:                   false,
    gestionar_empresas:           false,
    gestionar_usuarios:           false,
    crear_auditores:              false,
    ver_incidentes:               false,  // Solo si permisos_acceso.puede_ver_incidentes
    cerrar_incidentes:            false,
    ver_logs:                     false,
    precision_mapa:               'degradada',
  },
  supervisor: {
    ver_todos_los_datos:          true,
    editar_registros:             true,
    editar_registros_historicos:  false,
    eliminar_logico:              false,
    ver_mapa:                     true,
    exportar_coordenadas:         false,
    ver_firmas:                   true,
    gestionar_empresas:           false,
    gestionar_usuarios:           false,
    crear_auditores:              false,
    ver_incidentes:               true,
    cerrar_incidentes:            false,
    ver_logs:                     false,
    precision_mapa:               'exacta',
  },
} as const
```

---

## Filosofía UX del Operador — Feedback de Campo

> "El encargado de turno está hasta las pelotas de trabajo. Si la app le suma tarea, no la van a usar."
> — Feedback real de operaciones Venver

Esta es la regla que gobierna toda decisión de diseño en la vista del operador. El encargado de turno ya tiene responsabilidades críticas en campo. La app tiene que **quitarle trabajo**, no agregarle.

### Principios irrompibles

**1. La tablet ya sabe quién es**
La tablet del Equipo VS1 siempre es del Equipo VS1. El operador nunca selecciona equipo. Arranca directamente en su pantalla de trabajo. El `equipo_id` se configura una sola vez por el admin desde el panel web y se persiste en `localStorage` + `IndexedDB` encriptado. Cambiar el equipo asignado a una tablet solo lo puede hacer un admin, nunca desde la tablet misma.

**2. Las locaciones las carga el admin, no el operador**
Los pozos y locaciones (AAB 1012, etc.) se crean y asignan desde el panel admin antes de desplegar la tablet en campo. El operador solo ve la locación actual de su equipo como dato informativo (solo lectura). No puede crear ni modificar locaciones.

**3. Máximo 4 toques para registrar un ingreso**
```
Toque 1 → [Nuevo Ingreso]
Toque 2 → Ingresar DNI (teclado numérico grande)
Toque 3 → Confirmar datos (autocomplete de todo lo posible)
Toque 4 → Firmar y confirmar
```
Si el flujo requiere más de 4 interacciones, está mal diseñado y hay que simplificarlo.

**4. Máximo 60 segundos por registro**
Un ingreso completo (desde que la persona llega a la tablet hasta que queda registrada) no puede tomar más de 60 segundos. Si tarda más, van a volver al papel.

**5. Autocomplete agresivo**
Cualquier persona que ya visitó el equipo antes tiene todos sus datos guardados. Al tipear el DNI, el sistema autocompleta: nombre completo, empresa, función. El operador solo confirma con un toque. No tipea nombres.

**6. Cero decisiones de configuración para el operador**
El operador no configura nada. No elige idioma, no ajusta preferencias, no gestiona usuarios. Su pantalla tiene exactamente dos botones: [Nuevo Ingreso] y [Marcar Salida]. Todo lo demás es responsabilidad del admin.

**7. Errores silenciosos cuando sea posible**
Si falla el GPS → registrar igual sin coordenadas, sin mostrar error.
Si falla la subida a Supabase → encolar offline sin interrumpir el flujo.
El operador no tiene que tomar decisiones técnicas. La app las resuelve sola.

**8. La firma no tiene que ser perfecta**
El pad de firma acepta cualquier trazo de al menos 1 segundo de duración. No validar complejidad de firma. En campo, con guantes o con frío, la firma va a ser un garabato. Eso es suficiente — lo que importa es que haya una firma, no que sea legible.

---

## Reglas de Negocio Críticas

### Tablet bloqueada a su equipo

1. El `equipo_id` se configura **una sola vez** por el admin desde el panel web y se persiste en `localStorage` + `IndexedDB` con la clave `fieldpass_equipo_id`.
2. La vista del operador arranca directamente en su equipo asignado. **Nunca muestra selector de equipo.**
3. Reasignar una tablet a otro equipo solo lo puede hacer un `admin` desde el panel web. No existe esa opción en la interfaz del operador.
4. Si al iniciar la app no hay `equipo_id` persistido → mostrar pantalla de espera: "Esta tablet no está configurada. Contactá al administrador." con un código de dispositivo para vinculación remota.

### Locaciones — solo el admin las gestiona

5. Las locaciones (pozos, áreas) las crea y asigna el admin desde el panel web **antes** de desplegar la tablet en campo.
6. El operador ve la locación actual de su equipo como dato de solo lectura. No puede crear, editar ni cambiar la locación desde la tablet.
7. Si el equipo se mueve de locación, el admin lo actualiza desde el panel web. Queda registrado en `historial_ubicaciones_equipo`.

### Registro de acceso

8. `fecha_ingreso` la genera el servidor (`DEFAULT NOW()`). El cliente envía `created_at_local` solo como referencia para el sync offline, nunca como fecha oficial.
9. Si ya existe un registro `estado = 'dentro'` para el mismo `dni` + `equipo_id`, **bloquear** nuevo ingreso y mostrar el registro activo.
10. El constraint `fecha_egreso > fecha_ingreso` se valida en la base de datos.
11. Operador puede editar solo registros del **día actual**. Días anteriores requieren `admin` o `supervisor`.
12. `firma_ingreso` es obligatoria pero acepta cualquier trazo de mínimo 1 segundo. No validar complejidad — en campo con frío o guantes, un garabato es suficiente.
13. `registrado_por_usuario_id` siempre del JWT (`auth.uid()`), nunca del formulario.

### Declaración de Incidente — HSE (CRÍTICO)

14. El flujo de egreso **no puede completarse sin pasar por la pantalla de Declaración de Incidente**. Es un paso obligatorio e insalteable. Es parte del formulario físico original.
15. Si `declara_incidente = FALSE` (columna NO): firma → egreso se cierra normalmente.
16. Si `declara_incidente = TRUE` (columna SÍ):
    - Se abre el `FormIncidente` (obligatorio completarlo antes de cerrar el egreso)
    - Se hace `INSERT` en `incidentes`
    - Se dispara el trigger `notify_incidente` → alerta al admin
    - El incidente queda `estado: 'pendiente'` hasta que el admin lo gestione
    - El egreso se cierra igual (nunca retener físicamente a la persona)
17. Si la persona abandona el flujo sin firmar la declaración, el registro queda `estado: 'dentro'` y el operador debe gestionarlo manualmente.

### Locación vs Equipo

18. Son entidades distintas y ambas aparecen en el formulario físico.
    - **Locación**: el lugar geográfico permanente (pozo, área). Ej: `AAB 1012`
    - **Equipo**: la maquinaria/cuadrilla que opera ahí. Ej: `VS1`
    - Un equipo tiene `locacion_actual_id`. Puede moverse entre locaciones.
19. Al registrar un acceso, se guarda tanto `equipo_id` como `locacion_id` del momento exacto.

### Geolocalización

13. Coordenadas del equipo solo pueden actualizarlas el `operador` asignado o el `admin`.
14. Cada cambio genera una fila en `historial_ubicaciones_equipo`.
15. El auditor ve coordenadas con offset ±500m aplicado en el **frontend**. La DB siempre tiene la coordenada real.
16. La captura GPS al ingreso/egreso es **opcional**. Si falla, no bloquear el flujo. El campo queda `NULL`.
17. Si la tablet está a más de `VITE_GEOFENCE_WARN_DISTANCE_KM` del equipo, mostrar advertencia (no bloquear).

### Documentos de seguridad

18. Al buscar un DNI para ingreso, verificar `documentos_seguridad` con `fecha_vencimiento < NOW()`.
19. `nivel_alerta = 'warning'` + `bloqueante = false`: alerta amarilla, permite ingreso, queda en log.
20. `nivel_alerta = 'danger'` + `bloqueante = true`: alerta roja, **bloquea ingreso**. Solo admin puede hacer override con justificación (queda en log).

### Sesiones y offline

21. JWT: operador 7 días / admin 24h / auditor 8h. Auto-refresh silencioso antes del vencimiento.
22. Si el usuario pasa a `estado = 'inactivo'`, el próximo request falla por RLS → logout automático.
23. Máximo `VITE_MAX_OFFLINE_QUEUE` registros en cola offline. Al superarlo, alertar visualmente al operador.
24. Al sincronizar, el orden es cronológico por `created_at_local`. En conflictos: el servidor gana siempre.

### Soft delete

25. **Nunca** ejecutar `DELETE` físico en `registros_acceso`, `incidentes`, `equipos`, o `logs_sistema`. Solo `UPDATE deleted_at = NOW()`.
26. Todas las queries filtran `WHERE deleted_at IS NULL`. Usar una view `v_registros_acceso` que ya lo filtre.

---

## Flujos Críticos

### Flujo 1 — Nuevo Ingreso (Tablet Operador)

> Meta: máximo 4 toques, máximo 60 segundos. Si tarda más, el flujo está mal.

```
TOQUE 1 → [Nuevo Ingreso]

TOQUE 2 → DNI
  • Teclado numérico grande, ocupa toda la pantalla
  • Al terminar de tipear dispara búsqueda automática en background
  • Si DNI ya está "dentro" en el equipo → BLOQUEAR, mostrar registro activo
  • Si existe en historial → autocompleta TODO: nombre, empresa, función
  • Si no existe → pide nombre y empresa (mínimo posible)

TOQUE 3 → Confirmar datos
  • Si hubo autocomplete: pantalla de confirmación con datos pre-llenados
    El operador solo revisa → un toque en [Correcto] avanza
  • Único campo siempre obligatorio: motivo de visita (dropdown, no texto libre)
  • Patente del vehículo: opcional, se puede saltar
  • Documentos vencidos: warning amarillo no bloquea, danger rojo sí bloquea
  • GPS: se captura en silencio, nunca bloquea ni avisa si falla

TOQUE 4 → Firma y confirmar
  • Pad de firma grande, fondo blanco
  • Acepta cualquier trazo de mínimo 1 segundo (no validar complejidad)
  • [CONFIRMAR] → INSERT en Supabase o encola en IndexedDB si offline
  • Animación de éxito 1 segundo → vuelve a Home automáticamente
  • El operador no tiene que hacer nada más
```

### Flujo 2 — Egreso + Declaración de Incidente (Tablet Operador)

> Meta: máximo 3 toques para el caso feliz (sin incidente).

```
TOQUE 1 → [Marcar Salida]
  • Lista de personas "dentro": nombre grande, empresa, tiempo transcurrido
  • Búsqueda por nombre o DNI filtrada localmente (ya está en memoria, instantánea)
  • O escanear QR del visitante (feature flag VITE_FEATURE_QR)

TOQUE 2 → Seleccionar persona de la lista
  • GPS silencioso en background

6.  ┌──────── DECLARACIÓN DE INCIDENTE (OBLIGATORIA) ────────┐
    │                                                         │
    │  Firmá la columna que corresponde antes de salir        │
    │                                                         │
    │  ┌────────────────────┐  ┌─────────────────────────┐   │
    │  │        NO          │  │           SÍ            │   │
    │  │                    │  │                         │   │
    │  │  No he sufrido     │  │  Estuve involucrado en  │   │
    │  │  ningún incidente  │  │  un incidente o sufrí   │   │
    │  │                    │  │  una lesión. Se informó │   │
    │  │                    │  │  al Jefe de Equipo.     │   │
    │  │  [CANVAS FIRMA]    │  │  [CANVAS FIRMA]         │   │
    │  │  [CONFIRMAR]       │  │  [CONTINUAR]            │   │
    │  └────────────────────┘  └─────────────────────────┘   │
    └─────────────────────────────────────────────────────────┘

7a. Columna NO → firma → UPDATE registro (fecha_egreso, estado: 'afuera')
    → Mostrar resumen de permanencia → Home ✅

7b. Columna SÍ → firma → FormIncidente:
      → Descripción (textarea, obligatoria)
      → Tipo (lesión / accidente / casi accidente / daño material / otro)
      → Gravedad (leve / moderado / grave / crítico)
      → ¿Informó al Jefe? (toggle obligatorio)
      → Nombre del Jefe de Turno
      → Días perdidos estimados
    → [CONFIRMAR] →
        INSERT incidentes
        UPDATE registros_acceso (declara_incidente: true, fecha_egreso, estado: 'afuera')
        Trigger → alerta push al admin
    → "Egreso registrado ⚠️ Incidente declarado — el administrador fue notificado"
    → Home ✅
```

### Flujo 3 — Setup Coordenadas del Equipo (Solo Admin desde panel web)

> El operador NO configura la ubicación del equipo. Solo el admin.

```
1.  Admin abre el equipo desde el panel web → [Editar ubicación]
2.  Opciones:
    a. "Usar ubicación actual" → captura GPS del dispositivo del admin
    b. "Elegir en el mapa" → click en el mapa para posicionar el pin
    c. "Ingresar manualmente" → lat/lon con validación de rango Argentina
3.  Selector de Locación ("AAB 1012") → búsqueda o crear nueva
4.  [GUARDAR] → UPDATE equipos + INSERT en historial_ubicaciones_equipo
5.  La tablet del operador recibe la nueva ubicación automáticamente (Realtime)
```

### Flujo 4 — Mapa Admin / Auditor

```
1.  Se cargan los equipos autorizados según rol
2.  Auditor: coordenadas con offset ±500m en frontend (JS, no en DB)
3.  Pins coloreados:
      🟢 Verde  (#1D9E75) → operativo, personas dentro
      ⚫ Gris   (#888780) → sin actividad hoy
      🟡 Amber  (#BA7517) → en mantenimiento
      🔴 Rojo   (#E24B4A) → incidente pendiente
4.  Número en el pin = personas actualmente dentro
5.  Búsqueda por nombre de equipo o código de locación → centra el mapa
6.  Click en pin → Panel lateral:
      • Nombre equipo + locación + estado
      • Lista personas dentro (nombre, empresa, función, tiempo)
      • Últimos egresos del día
      • Incidentes pendientes (si tiene permiso)
      • [Exportar hoja del día] → Excel/PDF
7.  Supabase Realtime actualiza contadores y colores de pins en tiempo real
    sin recargar la página
```

---

## Índices HSE — Fórmulas estándar de la industria petrolera

```
IF (Índice de Frecuencia)  = (N° incidentes con lesión / Horas hombre totales) × 200.000
IG (Índice de Gravedad)    = (Días perdidos / Horas hombre totales) × 200.000
II (Índice de Incidencia)  = (N° incidentes / N° trabajadores distintos) × 1.000
Días sin incidente         = Días desde el último incidente con lesión en el equipo
```

YPF y la Secretaría de Energía exigen estos índices a las contratistas en sus auditorías. Tenerlos calculados automáticamente y exportables en PDF es un diferenciador de producto clave.

---

## Diseño — ClayUI Style

### Paleta principal

```css
/* Botones de acción principal (gradientes, solo en botones) */
--btn-ingreso:        linear-gradient(135deg, #7F77DD 0%, #534AB7 100%);
--btn-salida:         linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%);

/* Estados de equipo en mapa y badges */
--estado-operativo:   #1D9E75;   /* Verde Teal */
--estado-mant:        #BA7517;   /* Amber */
--estado-inactivo:    #888780;   /* Gris neutro */
--estado-incidente:   #E24B4A;   /* Rojo */

/* UI base */
--card-bg:            #FFFFFF;
--page-bg:            #F8F8F6;
--border:             rgba(0, 0, 0, 0.08);
--text-primary:       #2C2C2A;
--text-muted:         #5F5E5A;
```

### Principios de diseño

- Cards: fondo blanco, borde `0.5px solid rgba(0,0,0,0.08)`, `border-radius: 16px`, padding generoso
- Gradientes solo en botones primarios, **nunca** en fondos de página
- Mobile-first para la vista operador (mínimo 375px, óptimo 768px tablet)
- Desktop-first para admin y auditor
- Tipografía: Inter o sistema. `font-weight: 400` body, `500` subtítulos, nunca `700`
- Sin sombras decorativas. Sombra funcional solo en dropdowns y modales: `box-shadow: 0 4px 24px rgba(0,0,0,0.08)`
- Íconos: Lucide React, outline únicamente
- Animaciones: `transition: all 150ms ease`. Sin animaciones complejas que bloqueen la UX en tablet.

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Dev local
npm run dev

# Generar tipos TypeScript desde Supabase (correr cada vez que cambia el schema)
npx supabase gen types typescript --project-id TU_PROJECT_ID > src/types/database.types.ts

# Aplicar migrations
npx supabase db push

# Reset DB local (⚠️ borra todo)
npx supabase db reset

# Tests
npm run test

# Build producción
npm run build

# Preview build
npm run preview

# Lint
npm run lint

# Deploy manual a Vercel
vercel --prod
```

---

## Seguridad — Checklist de producción

- [ ] RLS habilitado en todas las tablas (verificar con `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` nunca en el frontend ni en el repo git
- [ ] Coordenadas de auditores degradadas ±500m en el frontend (no en la DB)
- [ ] Firmas en bucket privado de Supabase Storage con signed URLs de 15 min
- [ ] Rate limiting en Edge Functions: 100 req/min por IP
- [ ] Headers en `vercel.json`: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- [ ] JWT expiration: operador 7d / admin 24h / auditor 8h
- [ ] Logs de auditoría vía trigger (no confiar en el frontend para loguear)
- [ ] `equipo_id` y `empresa_id` siempre validados en RLS, no solo en el cliente
- [ ] DNI: solo numérico. CUIT: regex `^\d{2}-\d{8}-\d$`. Patente: alfanumérica.
- [ ] Soft delete siempre. Nunca `DELETE` físico en tablas de negocio.
- [ ] Declaración de incidente validada tanto en frontend (flujo) como en DB (trigger que verifica que `declara_incidente IS NOT NULL` antes de `estado = 'afuera'`)
- [ ] Máximo `VITE_MAX_OFFLINE_QUEUE` = 200 registros en cola offline. Alertar al operador si se acerca al límite.

---

## Notas de Arquitectura

**PWA, no React Native.** La tablet usa una Progressive Web App instalada en el browser. Ventajas: actualización sin App Store, funciona en cualquier tablet/browser, un solo codebase, offline con Service Workers.

**Zustand para UI, TanStack para servidor.** Zustand: panel lateral abierto, modo offline, equipo seleccionado en mapa. TanStack Query: fetch, caché, invalidaciones. No mezclar responsabilidades.

**TanStack Query sobre SWR** porque sus invalidaciones en cascada son críticas: un egreso con incidente debe invalidar al mismo tiempo la lista del operador, el pin del mapa, las métricas del día y el panel de incidentes del admin.

**Realtime con `.channel()`, no `.from().on()`** (deprecado en Supabase JS v2+).

**Timestamps del servidor, siempre.** El cliente envía `created_at_local` solo como referencia para el sync offline. La timestamp oficial en el registro es siempre el `DEFAULT NOW()` del servidor. Esto previene fraudes de manipulación de hora en la tablet.

**Soft delete con view.** Crear `CREATE VIEW v_registros_acceso AS SELECT * FROM registros_acceso WHERE deleted_at IS NULL` y usar la view en todos los selects del frontend.

**Locación y Equipo son entidades separadas.** No simplificar esto. El formulario físico de Venver muestra ambos campos (`EQUIPO N°` y `LOCACION`) porque son conceptos distintos en la operación real de yacimientos.

---

## Estado actual del proyecto — Mayo 2026

> Resumen de hito a hito para retomar contexto en futuras sesiones. Esta sección debe actualizarse cada vez que se completa una iteración significativa.

### Lo que está implementado y funcionando

**Auth & multi-tenant**
- Login con Supabase Auth + RLS por empresa.
- 5 roles operativos: `superadmin`, `admin`, `supervisor`, `operador`, `auditor`.
- Helper functions SECURITY DEFINER en DB: `auth_empresa_id()`, `auth_rol()` — usadas por todas las policies para evitar JOINs repetidos y stack overflow.
- **Persistencia de usuario en `localStorage`** (zustand persist). Al hacer F5, el usuario se rehidrata inmediatamente y la app no rebota a `/login` mientras Supabase hace cold start. Background revalidation vía `onAuthStateChange`.
- Safety timeout en `useAuthInit` extendido a 12s (cold start de Supabase free tier puede tardar 10-15s).
- `cargarUsuario` con retry (2 reintentos con backoff lineal de 800ms).

**Vistas implementadas**
- **Superadmin**: Plataforma, Métricas, Empresas, Usuarios, Permisos de Acceso, Logs Globales.
- **Admin**: Dashboard con KPIs, Mapa de Equipos (Leaflet), Registros con filtros + export Excel, Incidentes, Estadísticas, HSE, CRUD de Equipos / Locaciones / Usuarios / Auditores / Empresas, Documentos, Logs.
- **Auditor**: Dashboard, Mapa (con coordenadas degradadas ±500m en frontend), Incidentes, Reportes.
- **Operador (tablet)**: OperadorHome, NuevoIngreso, MarcarSalida, ConfigEquipo. Layout sin sidebar.

**UI / Tema**
- ClayUI design system (cards blancas/oscuras, gradientes solo en botones, sin sombras decorativas).
- **Modo oscuro/claro completo**:
  - `darkMode: 'class'` en `tailwind.config.js`.
  - Variables CSS en 2 paletas (`:root` y `.dark`) para: `--card-bg`, `--page-bg`, `--input-bg`, `--hover-bg`, `--border`, `--border-strong`, `--divider`, `--text-primary` / `--text-secondary` / `--text-muted` / `--text-faded`, `--skeleton`, sombras.
  - `useTheme` hook con persistencia en `localStorage` + respeta `prefers-color-scheme`.
  - `initTheme()` en `main.tsx` antes del primer render — sin flash.
  - Componente `ThemeToggle` (sol/luna) en Sidebar y LoginView.
  - Override de tiles de Leaflet para dark mode con CSS filters.
- **Logo oficial**: `<Logo />` en `src/components/ui/Logo.tsx`. SVG inline de un derrick (torre de perforación) con cross-bracing X y crown block. Mismo SVG en `public/favicon.svg`.

**Mapas y geo**
- Leaflet + OpenStreetMap tiles (sin Mapbox aún).
- PostGIS para coordenadas: `ubicacion_punto GEOMETRY(Point, 4326)` con `ST_SetSRID(ST_MakePoint(lng, lat), 4326)` o formato `POINT(lng lat)`.
- Métricas diarias desnormalizadas en `metricas_diarias`. **Ojo**: las columnas `indice_frecuencia` y `indice_gravedad` son `NUMERIC(10,2)` (NO `NUMERIC(8,4)` — desbordan con la fórmula de la industria que multiplica por 200,000).

**Datos de prueba**
- Seed cargado en producción con: 3 equipos (V51, Venver 10, Venver 22), 2 locaciones (AAB 1012, CAN 0045), ~10 personas con registros activos, 1 incidente pendiente.
- Para reseed: `ALTER TABLE equipos DISABLE TRIGGER USER` antes de UPDATEs masivos (el trigger `log_cambio_ubicacion_equipo` requiere `auth.uid()` que es NULL en SQL Editor).

### Decisiones arquitectónicas tomadas

- **TanStack Query v5 sobre SWR** — invalidaciones en cascada son críticas para que un egreso actualice mapa, métricas, dashboard, incidentes en simultáneo.
- **Zustand para UI / persist solo lo crítico** — `usuario` y `equipoId` se persisten; `isLoading`, `mapStore`, `offlineStore` son volátiles.
- **CSS variables sobre dark variants de Tailwind** — los componentes usan `bg-[var(--card-bg)]` en lugar de `bg-white dark:bg-gray-900`. Más DRY y permite cambios de paleta sin tocar componentes.
- **RLS sin self-references** — una policy que consulta su propia tabla causa stack overflow infinito. Las policies de `locaciones` se reescriben para consultar `equipos` (que apunta a locaciones), nunca al revés.
- **Coordenadas degradadas en frontend, no en DB** — el auditor recibe el dato real desde Supabase y un util JS le aplica offset ±500m antes de pintarlo en el mapa. La DB siempre tiene la verdad.

### Issues conocidos / cosas que vigilar

- **Cold start de Supabase free tier (10-15s)**. Mitigado con persistencia de usuario + timeout de 12s, pero en sesiones nuevas (sin localStorage) puede haber espera notable.
- **`bg-white` y otros colores hardcoded** — quedaron varios `bg-[#XXXXXX]` específicos (errores rojos, badges, etc.) que son aceptables porque mantienen su semántica en ambos temas. No reemplazar agresivamente.
- **Bundle > 500kB** — el build avisa. Cuando duela el TTI en tablet sin señal, hacer code splitting con `React.lazy()` por rol (operador no necesita el código del admin).
- **Coordenadas en seed**: si se reinserta data de prueba con la columna `ubicacion_punto` directamente como string, recordar formato `'POINT(lng lat)'` (lng primero).

### Pendientes — próximos pasos

**Funcional / negocio**
- [ ] **Service Worker + offline real**. Existen `offlineStore.ts` y `useOfflineSync.ts` pero el SW con Workbox no está implementado. La cola se guarda en memoria, no en IndexedDB persistente.
- [ ] **Subida de firmas a Supabase Storage** con signed URLs de 15min. Hoy se guardan como base64 en la columna `firma_*_data` (fallback offline). Falta el path al bucket privado.
- [ ] **Edge Function `alert-incidente`** — el trigger `notify_incidente` la llama vía `net.http_post`, pero la función todavía no está deployada. Cuando se cree un incidente real en producción, el trigger fallará silenciosamente.
- [ ] **Edge Function `generate-report-hse`** — PDF mensual con índices IF/IG.
- [ ] **Documentos de seguridad — flujo de bloqueo de ingreso**. Los datos están en la tabla `documentos_seguridad`, falta el chequeo en el flujo del operador (warning amarillo / danger rojo bloqueante).
- [ ] **QR scanner** detrás del feature flag `VITE_FEATURE_QR`. Para egreso rápido por escaneo del visitante.
- [ ] **Geofence**: validación opcional de que la tablet esté cerca del equipo (warning, no bloqueo).

**Técnico / DX**
- [ ] Code splitting por rol con `React.lazy()`. Reduciría el bundle inicial a ~600kB.
- [ ] Migrar a Mapbox cuando el plan free se quede chico (Leaflet OK para MVP).
- [ ] Agregar tests E2E del flujo de ingreso/egreso con Playwright.
- [ ] Headers de seguridad en `vercel.json` (CSP, X-Frame-Options).

**Producción**
- [ ] Confirmar que la promoción a producción de Vercel toma el último deploy con env vars correctas. La URL canónica es `wlogproject.vercel.app`.
- [ ] Configurar dominio propio cuando esté disponible.
- [ ] Verificar que las RLS policies actuales no tienen self-references después de cualquier nueva policy que se agregue.

### Archivos clave creados/modificados en la última sesión (modo oscuro + logo + F5 fix)

```
src/
├── hooks/
│   ├── useAuth.ts                    ← retry + timeout 12s + no recargar si rehidratado
│   └── useTheme.ts                   ← NUEVO: hook de tema con persist + initTheme()
├── stores/
│   └── authStore.ts                  ← persist también el usuario (no solo equipoId)
├── components/ui/
│   ├── Logo.tsx                      ← NUEVO: SVG derrick reutilizable
│   ├── ThemeToggle.tsx               ← NUEVO: botón sol/luna
│   ├── Input.tsx                     ← migrado a CSS vars
│   ├── Skeleton.tsx                  ← migrado a var(--skeleton)
│   └── (Card, Button, Badge, Modal, Table — usan utility classes ya con vars)
├── components/layout/
│   ├── Sidebar.tsx                   ← logo nuevo + ThemeToggle + vars
│   ├── TopBar.tsx                    ← migrado a vars
│   └── PageLayout.tsx                ← bg con var(--page-bg)
├── views/auth/
│   └── LoginView.tsx                 ← logo nuevo + ThemeToggle fixed top-right
├── main.tsx                          ← initTheme() antes de createRoot
├── index.css                         ← variables .dark + utility classes nuevas + leaflet dark
public/
└── favicon.svg                       ← derrick consistente con <Logo />
tailwind.config.js                    ← darkMode: 'class'
```

Bulk migration de colores con `sed -E` para cambiar `text-[#2C2C2A]`, `text-[#5F5E5A]`, etc. → `text-[var(--text-primary)]`, `text-[var(--text-secondary)]`. Hecho en ~80 archivos en una sola pasada. Si aparece un nuevo archivo con esos hex, usar el mismo enfoque.

### Hotfix posterior — `parseGeoPoint` (mapa crash con LatLng undefined)

**Síntoma**: `/admin/mapa` rompía con `Invalid LatLng object: (undefined, undefined)` y bloqueaba toda la app via error boundary. Tras F5 quedaba en la misma URL → crash en loop, parecía que "no cargaba data".

**Causa**: Supabase devuelve columnas `GEOMETRY` como GeoJSON `{type: 'Point', coordinates: [lng, lat]}` (no como `{lat, lng}`). El tipo `Equipo.ubicacion_punto?: { lat: number; lng: number }` en `models.ts` está mintiendo. `MapaEquipos.tsx` (admin) accedía directo a `.lat`/`.lng` → undefined → Leaflet crashea al construir el LatLng. `EquiposMap.tsx` y `ConfigEquipo.tsx` ya manejaban `coordinates?.[1]` con fallback, pero `GestionLocaciones` también accedía mal.

**Fix**: util compartido [src/lib/geo.ts](src/lib/geo.ts) con `parseGeoPoint(value): [number, number] | null` que retorna null si no parsea, y `offsetCoords` para auditor. Todos los consumidores ahora usan el util:
- [MapaEquipos.tsx](src/views/admin/MapaEquipos.tsx) — usa `parseGeoPoint` antes de pasar position al Marker
- [EquiposMap.tsx](src/components/map/EquiposMap.tsx) — `getLatLng` reescrito como wrapper de `parseGeoPoint`
- [GestionLocaciones.tsx](src/views/admin/GestionLocaciones.tsx) — render de columna Coordenadas
- [ConfigEquipo.tsx](src/views/operador/ConfigEquipo.tsx) — display de coord actual

**Regla a futuro**: NUNCA acceder a `ubicacion_punto.lat`/`.lng` directo. Siempre `parseGeoPoint(ubicacion_punto)`. El tipo en `models.ts` queda como está (mentiroso) por compat, pero el util es la única fuente de verdad para extraer coordenadas.

### Debug helper

- `__supabase` está expuesto en `window` desde [src/lib/supabase.ts](src/lib/supabase.ts). En la consola del navegador podés hacer `await __supabase.from('equipos').select('*')` para inspeccionar respuestas.
- `[DebugPanel](src/components/shared/DebugPanel.tsx)` se muestra cuando agregás `?debug=1` en la URL. Imprime usuario/rol/empresa_id y prueba count + sample de las 10 tablas principales para detectar rápido qué query devuelve 0 rows o un error específico de RLS.

### Hotfix — desync entre usuario rehidratado y session de Supabase

**Síntoma**: Tras F5, sidebar mostraba "Administrador Venver" (usuario logueado), pero todos los KPIs y todas las tablas (Equipos, Locaciones, Usuarios, Empresas, Documentos, Logs, Estadísticas, HSE) volvían vacías. Sólo Registros mostraba datos — pero eran cache vieja de TanStack Query.

**Causa raíz**: El fix anterior persistía el usuario en localStorage para sobrevivir el cold start de Supabase. Pero el JWT de auth (manejado por supabase-js, no por nuestro store) tiene su propio ciclo de vida. Cuando el refresh token expiraba o se perdía, supabase-js no tenía session pero nuestro store seguía con el usuario rehidratado. Las queries salían como anónimas → RLS deniega → 0 filas en todo (sin error visible). Diagnóstico vía DebugPanel: `session: nada` con usuario presente fue la pista decisiva.

**Fix**: reescribir [useAuthInit](src/hooks/useAuth.ts) para hacer `supabase.auth.getSession()` sincrónico al inicio. Si no hay session válida → `setUsuario(null)` y `setLoading(false)` → guard manda a /login. Eliminado el `safetyTimeout` arbitrario de 12s y la lógica de "soltar el lock con usuario rehidratado". También agregado handler para `TOKEN_REFRESHED` con session null (refresh fallido durante uso).

**Regla a futuro**: la fuente de verdad de "estoy autenticado" es `supabase.auth.getSession()`, no el usuario en zustand. El usuario persistido es sólo un cache de los datos de la fila `usuarios` para no esperar el SELECT post-login. Si las dos cosas no concuerdan, gana supabase y se limpia el cache.
