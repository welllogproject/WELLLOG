# WELL LOG
## Control de Acceso Digital para Yacimientos Petroleros

---

## ¿Qué es WELL LOG?

WELL LOG es una plataforma digital que reemplaza las planillas físicas de control de acceso en equipos petroleros. Digitaliza el registro de ingreso y egreso de personal, proporcionando trazabilidad en tiempo real, métricas HSE y cumplimiento normativo.

---

## El Problema

Las empresas de servicios petroleros (como Venver) operan decenas de equipos distribuidos en yacimientos de todo el país. En cada equipo, un operador registra manualmente en planillas de papel:

- Quién entra y quién sale
- Hora de ingreso y egreso
- Empresa, función y motivo de visita
- Declaración de incidentes al egreso
- Firma del visitante

**Problemas del sistema actual:**

- **Sin trazabilidad en tiempo real** — nadie sabe cuántas personas hay dentro de un equipo hasta que se revisa la planilla
- **Riesgo legal** — planillas se pierden, se mojan, se rompen. Ante una auditoría de YPF o un accidente, no hay respaldo
- **Sin métricas HSE** — calcular Índice de Frecuencia o Gravedad requiere horas de trabajo manual
- **Sin control de documentación** — personal con ATS o inducciones vencidas ingresa sin que nadie lo detecte
- **Operadoras sin visibilidad** — YPF no puede ver en tiempo real qué pasa en los equipos que contrató

---

## La Solución

WELL LOG digitaliza todo el proceso en una tablet en campo, con acceso web para supervisores y auditores:

### Para el Operador (tablet en campo)
- Registro de ingreso en menos de 60 segundos (DNI → datos → firma → listo)
- Autocomplete de visitantes frecuentes
- Declaración de incidente al egreso (replica exacta del formulario físico)
- Funciona sin internet (sincroniza cuando recupera señal)
- GPS automático de cada registro

### Para el Supervisor / Admin (desktop)
- Dashboard con KPIs en tiempo real: personas dentro, ingresos del día, incidentes pendientes
- Mapa interactivo con todos los equipos y su estado
- Estadísticas HSE: Índice de Frecuencia, Índice de Gravedad, días sin lesión
- Gestión completa: equipos, locaciones, usuarios, documentos de seguridad
- Exportar registros a Excel/PDF
- Alertas de documentación vencida (bloquea ingreso si es crítica)

### Para la Operadora / Auditor (acceso invitado)
- Vista de solo lectura de los equipos autorizados
- Datos en tiempo real sin depender de informes manuales
- Exportar reportes filtrados
- Acceso controlado: el contratista decide qué comparte y con quién

### Para la Plataforma (superadmin)
- Multi-tenant: cada empresa es independiente
- Monitoreo de tablets en vivo (GPS, estado, última actividad)
- Inventario de dispositivos
- Historial de sesiones y auditoría global

---

## ¿Por qué WELL LOG?

| Ventaja | Detalle |
|---------|---------|
| **Cumplimiento normativo** | Registros digitales con firma, GPS y timestamp. Respaldo ante auditorías de YPF/operadoras |
| **Tiempo real** | Saber cuántas personas hay en cada equipo en cualquier momento, desde cualquier lugar |
| **Métricas HSE automáticas** | IF, IG, días sin lesión — calculados automáticamente, sin planillas Excel |
| **Control de documentación** | ATS, inducciones y certificaciones con alertas de vencimiento. Bloqueo automático si está vencido |
| **Offline-first** | La tablet funciona sin internet. Los datos se sincronizan cuando hay señal |
| **Multi-tenant** | Una sola plataforma para múltiples empresas, cada una con sus datos aislados |
| **Autoservicio** | El admin gestiona todo sin depender del proveedor: usuarios, equipos, auditores |
| **Auditoría completa** | Cada acción queda registrada: quién, cuándo, desde dónde |

---

## Tecnología

- **Aplicación web progresiva (PWA)** — se instala como app en la tablet, funciona offline
- **Base de datos en la nube** — PostgreSQL con seguridad a nivel de fila (cada empresa solo ve sus datos)
- **Actualizaciones automáticas** — cuando se deploya una mejora, las tablets se actualizan solas
- **Geolocalización** — cada registro incluye coordenadas GPS
- **Tiempo real** — los cambios se reflejan instantáneamente en todos los dispositivos conectados
- **Encriptación** — datos en tránsito y en reposo protegidos

---

## ¿Qué incluye el servicio?

### Hardware
- Tablets Android configuradas con WELL LOG (una por equipo)
- Configuración de modo kiosco (la tablet solo muestra la app)
- Cuenta Google para gestión remota (localizar, bloquear, borrar)

### Software
- Plataforma WELL LOG completa (operador + admin + auditor)
- Panel de superadministración para el proveedor
- Actualizaciones continuas sin costo adicional
- Monitoreo de dispositivos en tiempo real

### Soporte
- Soporte técnico por WhatsApp y email
- Capacitación inicial para supervisores y operadores
- Resolución de incidencias en menos de 24 horas

---

## Modelo de Costos

### Setup Inicial (una vez)

| Concepto | Detalle |
|----------|---------|
| Configuración de la plataforma | Creación de empresa, equipos, locaciones, usuarios |
| Tablets (1 por equipo) | Android 10", configuradas y listas para usar |
| Capacitación | Sesión para supervisores + guía para operadores |
| Puesta en marcha | Verificación en campo de cada equipo |

**Costo estimado:** USD 10.000 – 15.000 (según cantidad de equipos)
*50% al firmar contrato, 50% a la entrega*

### Cuota Mensual

| Concepto | Incluye |
|----------|---------|
| Plataforma WELL LOG | Acceso completo para todos los roles |
| Infraestructura cloud | Base de datos, almacenamiento, CDN |
| Actualizaciones | Nuevas funcionalidades sin costo extra |
| Soporte técnico | WhatsApp + email, L-V 8-18hs |
| Reposición de tablets | Reemplazo de dispositivos dañados (hasta 2/año) |
| Monitoreo | Estado de tablets, alertas de desconexión |

**Cuota mensual:** USD 8.000 – 12.000 (según cantidad de equipos)

### Ejemplo: Empresa con 50 equipos

| Item | Monto |
|------|-------|
| Setup inicial | USD 12.000 |
| Cuota mensual | USD 10.000/mes |
| Contrato mínimo | 24 meses |
| **Valor total del contrato** | **USD 252.000** |
| **Costo por equipo/mes** | **USD 200** |

---

## Comparativa

| | Planilla física | WELL LOG |
|--|----------------|----------|
| Tiempo de registro | 2-3 minutos | 45 segundos |
| Trazabilidad | Nula (papel) | Total (digital + GPS) |
| Métricas HSE | Manual (horas) | Automático (tiempo real) |
| Acceso para operadoras | Informes mensuales | Tiempo real |
| Riesgo ante auditoría | Alto | Mínimo |
| Control de documentación | No existe | Automático con bloqueo |
| Costo por equipo/mes | ~USD 0 (pero riesgo alto) | USD 200 |

---

## Próximos Pasos

1. **Demo en vivo** — mostrar la plataforma funcionando con datos reales
2. **Piloto** — implementar en 2-3 equipos durante 30 días
3. **Evaluación** — medir mejoras en tiempo de registro, trazabilidad y cumplimiento
4. **Implementación completa** — rollout a todos los equipos

---

## Contacto

**WELL LOG**
Control de acceso digital para yacimientos petroleros

📧 welllogsupport@gmail.com
🌐 wlogproject.vercel.app

---

*Documento generado en Mayo 2026*
