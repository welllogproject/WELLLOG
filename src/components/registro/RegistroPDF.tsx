// src/components/registro/RegistroPDF.tsx
// Genera un PDF que replica exactamente el "Registro de Visita al Equipo" de Venver
// Incluye todos los datos del formulario físico + firma digital

import {
  Document, Page, Text, View, StyleSheet, Image,
  Font, pdf,
} from '@react-pdf/renderer'
import type { RegistroAcceso } from '@/types/models'

// ── Estilos ────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 32,
    color: '#1A1A18',
    backgroundColor: '#FFFFFF',
  },

  // Encabezado
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#7F77DD',
  },
  headerLeft: { flexDirection: 'column' },
  headerTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#534AB7' },
  headerSub: { fontSize: 8, color: '#6B6A66', marginTop: 2 },
  equipoBadge: {
    backgroundColor: '#7F77DD',
    color: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },

  // Sección de datos
  section: {
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#E4E4E1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#F4F4F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E4E1',
  },
  sectionHeaderText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#6B6A66',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: { padding: 10 },

  // Filas de datos
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  field: { flex: 1 },
  fieldLabel: {
    fontSize: 7,
    color: '#9A9894',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 10,
    color: '#1A1A18',
    fontFamily: 'Helvetica-Bold',
  },
  fieldValueNormal: {
    fontSize: 10,
    color: '#1A1A18',
  },

  // Horas
  horasRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  horaBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#E4E4E1',
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  horaLabel: { fontSize: 7, color: '#9A9894', textTransform: 'uppercase', marginBottom: 3 },
  horaValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#1A1A18' },

  // Declaración de incidente
  declaracionSection: {
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#E4E4E1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  declaracionHeader: {
    backgroundColor: '#534AB7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  declaracionHeaderText: {
    color: 'white',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnas: {
    flexDirection: 'row',
  },
  columna: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  columnaNo: {
    borderRightWidth: 0.5,
    borderRightColor: '#E4E4E1',
  },
  columnaLabel: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  columnaDesc: {
    fontSize: 7,
    color: '#6B6A66',
    textAlign: 'center',
    lineHeight: 1.4,
    marginBottom: 8,
  },
  firmaBox: {
    width: '100%',
    height: 60,
    borderWidth: 0.5,
    borderColor: '#E4E4E1',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  firmaImage: {
    width: '100%',
    height: 58,
    objectFit: 'contain',
  },
  firmaPlaceholder: {
    fontSize: 7,
    color: '#C8C7C2',
  },

  // Columna seleccionada
  columnaSeleccionadaNo: {
    backgroundColor: '#1D9E75',
  },
  columnaSeleccionadaSi: {
    backgroundColor: '#E24B4A',
  },
  columnaLabelSelected: {
    color: 'white',
  },
  columnaDescSelected: {
    color: 'rgba(255,255,255,0.85)',
  },

  // Incidente
  incidenteSection: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E24B4A',
    borderRadius: 6,
    overflow: 'hidden',
  },
  incidenteHeader: {
    backgroundColor: '#E24B4A',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  incidenteHeaderText: {
    color: 'white',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#E4E4E1',
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: '#9A9894' },
})

// ── Helpers ────────────────────────────────────────────────
function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch { return '—' }
}

function formatHora(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

// ── Componente PDF ─────────────────────────────────────────
interface RegistroPDFProps {
  registro: RegistroAcceso & {
    equipo?: { nombre_equipo: string }
    locacion?: { codigo: string; nombre?: string }
    incidente?: {
      descripcion: string
      tipo?: string
      gravedad: string
      dias_perdidos: number
      informo_jefe_turno: boolean
      jefe_turno_nombre?: string
    }
  }
}

export function RegistroPDFDocument({ registro }: RegistroPDFProps) {
  const declaroSi = registro.declara_incidente === true
  const declaroNo = registro.declara_incidente === false
  const pendiente = registro.declara_incidente === null || registro.declara_incidente === undefined

  return (
    <Document
      title={`Registro de Visita — ${registro.nombre_completo}`}
      author="WELL LOG"
      subject="Registro de Visita al Equipo"
    >
      <Page size="A4" style={S.page}>

        {/* ── Encabezado ── */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <Text style={S.headerTitle}>REGISTRO DE VISITA AL EQUIPO</Text>
            <Text style={S.headerSub}>WELL LOG — Sistema digital de control de acceso</Text>
          </View>
          {registro.equipo && (
            <Text style={S.equipoBadge}>
              {registro.equipo.nombre_equipo}
            </Text>
          )}
        </View>

        {/* ── Datos de la visita ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionHeaderText}>Datos de la visita</Text>
          </View>
          <View style={S.sectionBody}>
            <View style={S.row}>
              <View style={S.field}>
                <Text style={S.fieldLabel}>Fecha</Text>
                <Text style={S.fieldValue}>{formatFecha(registro.fecha_ingreso)}</Text>
              </View>
              {registro.locacion && (
                <View style={S.field}>
                  <Text style={S.fieldLabel}>Locación</Text>
                  <Text style={S.fieldValue}>
                    {registro.locacion.codigo}{registro.locacion.nombre ? ` — ${registro.locacion.nombre}` : ''}
                  </Text>
                </View>
              )}
            </View>

            <View style={S.row}>
              <View style={[S.field, { flex: 2 }]}>
                <Text style={S.fieldLabel}>Apellido, Nombre</Text>
                <Text style={S.fieldValue}>{registro.nombre_completo}</Text>
              </View>
              <View style={S.field}>
                <Text style={S.fieldLabel}>DNI</Text>
                <Text style={S.fieldValue}>{registro.dni}</Text>
              </View>
            </View>

            <View style={S.row}>
              <View style={[S.field, { flex: 2 }]}>
                <Text style={S.fieldLabel}>Empresa / Entidad</Text>
                <Text style={S.fieldValueNormal}>{registro.empresa_visitante_nombre ?? '—'}</Text>
              </View>
              <View style={S.field}>
                <Text style={S.fieldLabel}>Función</Text>
                <Text style={S.fieldValueNormal}>{registro.funcion_visitante ?? '—'}</Text>
              </View>
            </View>

            <View style={S.row}>
              <View style={S.field}>
                <Text style={S.fieldLabel}>Motivo de la visita</Text>
                <Text style={S.fieldValueNormal}>{registro.motivo_visita}</Text>
              </View>
              {registro.vehiculo_patente && (
                <View style={S.field}>
                  <Text style={S.fieldLabel}>Vehículo / Patente</Text>
                  <Text style={S.fieldValueNormal}>{registro.vehiculo_patente}</Text>
                </View>
              )}
            </View>

            {/* Horas */}
            <View style={S.horasRow}>
              <View style={S.horaBox}>
                <Text style={S.horaLabel}>Hora de llegada</Text>
                <Text style={S.horaValue}>{formatHora(registro.fecha_ingreso)}</Text>
              </View>
              <View style={S.horaBox}>
                <Text style={S.horaLabel}>Hora de salida</Text>
                <Text style={[S.horaValue, { color: registro.fecha_egreso ? '#1D9E75' : '#9A9894' }]}>
                  {registro.fecha_egreso ? formatHora(registro.fecha_egreso) : 'Dentro'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Firma de ingreso ── */}
        {registro.firma_ingreso_data && (
          <View style={S.section}>
            <View style={S.sectionHeader}>
              <Text style={S.sectionHeaderText}>Firma de ingreso</Text>
            </View>
            <View style={[S.sectionBody, { height: 70 }]}>
              <Image src={registro.firma_ingreso_data} style={S.firmaImage} />
            </View>
          </View>
        )}

        {/* ── Declaración de incidente ── */}
        <View style={S.declaracionSection}>
          <View style={S.declaracionHeader}>
            <Text style={S.declaracionHeaderText}>
              Firmar la columna que corresponde antes de salir
            </Text>
          </View>
          <View style={S.columnas}>
            {/* Columna NO */}
            <View style={[
              S.columna,
              S.columnaNo,
              declaroNo ? S.columnaSeleccionadaNo : {},
            ]}>
              <Text style={[S.columnaLabel, declaroNo ? S.columnaLabelSelected : { color: '#1D9E75' }]}>
                NO
              </Text>
              <Text style={[S.columnaDesc, declaroNo ? S.columnaDescSelected : {}]}>
                No ha sufrido ningún incidente
              </Text>
              <View style={S.firmaBox}>
                {declaroNo && registro.firma_declaracion_data ? (
                  <Image src={registro.firma_declaracion_data} style={S.firmaImage} />
                ) : (
                  <Text style={S.firmaPlaceholder}>
                    {declaroNo ? 'Firma' : pendiente ? 'Pendiente' : ''}
                  </Text>
                )}
              </View>
            </View>

            {/* Columna SÍ */}
            <View style={[
              S.columna,
              declaroSi ? S.columnaSeleccionadaSi : {},
            ]}>
              <Text style={[S.columnaLabel, declaroSi ? S.columnaLabelSelected : { color: '#E24B4A' }]}>
                SÍ
              </Text>
              <Text style={[S.columnaDesc, declaroSi ? S.columnaDescSelected : {}]}>
                He estado involucrado en un incidente o sufrí una lesión — se informó al Jefe de Equipo/Encargado de Turno
              </Text>
              <View style={S.firmaBox}>
                {declaroSi && registro.firma_declaracion_data ? (
                  <Image src={registro.firma_declaracion_data} style={S.firmaImage} />
                ) : (
                  <Text style={S.firmaPlaceholder}>
                    {declaroSi ? 'Firma' : ''}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ── Detalle del incidente (si declaró SÍ) ── */}
        {declaroSi && registro.incidente && (
          <View style={S.incidenteSection}>
            <View style={S.incidenteHeader}>
              <Text style={S.incidenteHeaderText}>⚠️ Detalle del incidente</Text>
            </View>
            <View style={S.sectionBody}>
              <View style={S.row}>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>Tipo</Text>
                  <Text style={S.fieldValueNormal}>{registro.incidente.tipo ?? '—'}</Text>
                </View>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>Gravedad</Text>
                  <Text style={[S.fieldValue, {
                    color: registro.incidente.gravedad === 'critico' || registro.incidente.gravedad === 'grave'
                      ? '#E24B4A' : '#BA7517',
                  }]}>
                    {registro.incidente.gravedad.charAt(0).toUpperCase() + registro.incidente.gravedad.slice(1)}
                  </Text>
                </View>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>Días perdidos</Text>
                  <Text style={S.fieldValueNormal}>{registro.incidente.dias_perdidos}</Text>
                </View>
              </View>
              <View style={S.row}>
                <View style={S.field}>
                  <Text style={S.fieldLabel}>Descripción</Text>
                  <Text style={S.fieldValueNormal}>{registro.incidente.descripcion}</Text>
                </View>
              </View>
              {registro.incidente.informo_jefe_turno && registro.incidente.jefe_turno_nombre && (
                <View style={S.row}>
                  <View style={S.field}>
                    <Text style={S.fieldLabel}>Jefe de turno informado</Text>
                    <Text style={S.fieldValueNormal}>{registro.incidente.jefe_turno_nombre}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>
            WELL LOG — Registro generado el {formatFecha(new Date().toISOString())} a las {formatHora(new Date().toISOString())}
          </Text>
          <Text style={S.footerText}>ID: {registro.id.slice(0, 8).toUpperCase()}</Text>
        </View>

      </Page>
    </Document>
  )
}

// ── Función helper para descargar el PDF ───────────────────
export async function descargarRegistroPDF(
  registro: RegistroPDFProps['registro']
): Promise<void> {
  const blob = await pdf(<RegistroPDFDocument registro={registro} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `registro_${registro.nombre_completo.replace(/\s+/g, '_')}_${registro.id.slice(0, 8)}.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
