# WELL LOG — Guía de Pruebas
**URL del sistema:** https://wlogproject.vercel.app

---

## Cuentas disponibles para probar

| Rol | Email | Contraseña | Qué puede hacer |
|-----|-------|------------|-----------------|
| **Super Admin** | welllogsupport@gmail.com | $uperAdmin | Todo — gestión de la plataforma completa |
| **Admin Venver** | admin@venver.com.ar | Admin#Venver1 | Gestionar equipos, usuarios, ver registros de Venver |
| **Operador V51** | operador.v51@venver.com.ar | Op#V51campo | Registrar ingresos/egresos en el equipo V51 |
| **Operador V10** | operador.v10@venver.com.ar | Op#V10campo | Registrar ingresos/egresos en el equipo Venver 10 |
| **Auditor YPF** | auditor@ypf.com | Audit#YPF1 | Ver registros de V51 y Venver 10 (solo lectura) |

---

## Flujo 1 — Operador en campo (el más importante)

**Entrar como:** `operador.v51@venver.com.ar` / `Op#V51campo`

Este es el flujo que usa el guardia en la tranquera del equipo petrolero.

### Paso 1: Ver quién está dentro
- Al entrar ves la pantalla principal con el contador de personas dentro
- Hay 5 personas dentro del equipo V51 cargadas de prueba
- Podés buscar por nombre o DNI en el buscador

### Paso 2: Registrar un nuevo ingreso
1. Tocá **"Nuevo Ingreso"**
2. Ingresá un DNI cualquiera de 8 dígitos (ej: `12345678`)
3. Completá los datos: nombre, empresa, función, motivo de visita
   - Si usás un DNI que ya visitó antes, los datos se completan solos
4. Tocá **"Datos Correctos — Continuar"**
5. Firmá en el recuadro con el mouse (o dedo en tablet)
6. Tocá **"Confirmar Ingreso"**
7. ✅ Aparece la pantalla de éxito y vuelve al inicio

### Paso 3: Registrar una salida (caso normal — sin incidente)
1. Tocá **"Marcar Salida"**
2. Buscá a la persona por nombre o usá el modo **"DNI"** (numpad)
3. Tocá la persona para seleccionarla
4. Aparece el formulario de declaración — tocá la columna **"NO"** (no hubo incidente)
5. Firmá en el recuadro
6. Tocá **"Confirmar Egreso"**
7. ✅ Vuelve al inicio automáticamente

### Paso 4: Registrar una salida CON incidente
1. Repetí el paso 3 pero esta vez tocá la columna **"SÍ"**
2. Firmá
3. Tocá **"Continuar — Registrar Incidente"**
4. Completá el formulario: descripción, tipo, gravedad
5. Tocá **"Confirmar y Registrar Incidente"**
6. ✅ El admin recibe una notificación automática

### Paso 5: Probar el modo sin internet
1. En el navegador, abrí las herramientas de desarrollador (F12)
2. Ir a la pestaña **Network** → seleccionar **"Offline"**
3. Intentá registrar un ingreso — funciona igual
4. El banner naranja muestra cuántos registros están en cola
5. Volvé a "Online" — los registros se sincronizan solos

---

## Flujo 2 — Administrador de Venver

**Entrar como:** `admin@venver.com.ar` / `Admin#Venver1`

### Qué ver primero: Dashboard
- KPIs en tiempo real: personas dentro, ingresos del día, equipos activos, incidentes pendientes
- Lista de actividad reciente con nombres reales
- Estado de los 3 equipos de Venver (V51, Venver 10, Venver 22)

### Registros
- Ir a **Registros** en el menú
- Hay 62 registros de prueba de los últimos días
- Probá los filtros: por equipo, por fecha, por nombre
- Tocá el ícono de PDF en cualquier fila para descargar el registro

### Incidentes
- Ir a **Incidentes**
- Hay 2 incidentes pendientes de investigación
- Tocá uno → completá la conclusión → tocá **"Cerrar Incidente"**

### Mapa de equipos
- Ir a **Mapa de Equipos**
- Los 3 equipos de Venver aparecen en el mapa (Neuquén y Mendoza)
- Tocá un pin para ver el panel con personas dentro

### HSE (Seguridad)
- Ir a **HSE**
- Ver los índices IF e IG calculados con datos reales
- Gráficos de los últimos 14 días

### Gestión de equipos
- Ir a **Equipos**
- Podés editar el equipo V51 y asignar el operador `operador.v51@venver.com.ar`
- Esto es necesario para que el operador pueda usar la tablet

### Invitar un usuario nuevo
- Ir a **Usuarios** → **"Invitar usuario"**
- Completá los datos con un email cualquiera
- El sistema crea el usuario y copia el link de activación al portapapeles
- (El email automático requiere dominio propio — por ahora el link se copia)

### Dar acceso a YPF
- Ir a **Auditores**
- Ya hay permisos configurados para que YPF vea V51 y Venver 10
- Podés crear un nuevo permiso o revocar uno existente

### Documentos de seguridad
- Ir a **Documentos**
- Hay documentos vencidos (en rojo) y próximos a vencer (en naranja)
- Probá cargar un documento nuevo

---

## Flujo 3 — Auditor de YPF (solo lectura)

**Entrar como:** `auditor@ypf.com` / `Audit#YPF1`

### Qué puede ver
- **Dashboard**: equipos autorizados (V51 y Venver 10), personas dentro ahora
- **Mapa**: ubicaciones aproximadas ±500m (por privacidad)
- **Incidentes**: los 2 incidentes de V51 (tiene permiso para verlos)
- **Reportes**: exportar registros en CSV

### Qué NO puede hacer
- No puede modificar nada
- No ve el equipo Venver 22 (no tiene permiso)
- No ve coordenadas exactas (solo aproximadas)

### Exportar un reporte
1. Ir a **Reportes**
2. Seleccionar equipo V51
3. Elegir un rango de fechas (últimos 30 días)
4. Tocá **"Exportar CSV"**
5. Se descarga el archivo con todos los registros

---

## Flujo 4 — Super Admin (gestión de la plataforma)

**Entrar como:** `welllogsupport@gmail.com` / `$uperAdmin`

### Dashboard de plataforma
- Ver KPIs globales: 14 empresas, 6 usuarios, 12 equipos, registros del día

### Gestión de empresas
- Ir a **Empresas**
- Ver todas las empresas: Venver, YPF, TotalEnergies, Schlumberger, etc.
- Podés crear una nueva empresa, cambiar el plan, suspender

### Métricas globales
- Ir a **Métricas**
- Gráficos de actividad de toda la plataforma
- Registros por día, incidentes por mes, distribución de empresas

### Soporte y backups
- Ir a **Soporte**
- Ver el estado del sistema (DB, Auth, Realtime)
- Ejecutar un backup manual → tocá **"Backup ahora"**
- Ver el historial de backups (se ejecuta automáticamente a las 3 AM)

### Configuración
- Ir a **Configuración**
- Ver las variables de entorno activas
- Ver los feature flags (QR, Geofence, etc.)

### Logs globales
- Ir a **Logs Globales**
- Ver todas las acciones de todos los usuarios de la plataforma
- Filtrar por empresa o tipo de acción
- Exportar a CSV

---

## Cosas a tener en cuenta al probar

1. **Los datos son de prueba** — podés crear, editar y borrar sin miedo
2. **El mapa necesita coordenadas** — los equipos V51, Venver 10 y Venver 22 ya tienen coordenadas cargadas en Neuquén y Mendoza
3. **Las firmas** — en la computadora se firman con el mouse. En tablet/celular con el dedo
4. **El modo oscuro** — hay un botón de sol/luna en el sidebar para cambiar el tema
5. **La guía de uso** — al entrar por primera vez aparece una guía paso a paso. También se puede abrir con el ícono de libro en la barra superior
6. **Soporte** — hay un botón de ayuda (auricular) en la barra superior para contactar por WhatsApp o email

---

## Si algo no funciona

- **"Credenciales inválidas"** → verificar que la contraseña esté escrita exactamente igual (mayúsculas, símbolos)
- **Pantalla en blanco** → presionar F5 para recargar
- **El mapa no carga** → necesita conexión a internet para cargar los tiles de OpenStreetMap
- **Los datos no aparecen** → esperar unos segundos, los datos se cargan desde Supabase

---

*Documento generado para pruebas internas — Mayo 2026*
