// src/components/shared/OnboardingGuide.tsx
// Guía de uso por rol — aparece la primera vez, accesible desde el botón de ayuda
// Se guarda en localStorage para no molestar después del primer uso

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'
import type { Rol } from '@/types/roles'

interface Paso {
  titulo: string
  descripcion: string
  emoji: string
}

const GUIAS: Partial<Record<Rol, { bienvenida: string; pasos: Paso[] }>> = {
  operador: {
    bienvenida: 'Bienvenido al sistema de control de acceso WELL LOG',
    pasos: [
      {
        emoji: '📋',
        titulo: 'Pantalla principal',
        descripcion: 'Acá ves cuántas personas están dentro del equipo ahora mismo. La lista se actualiza en tiempo real.',
      },
      {
        emoji: '➕',
        titulo: 'Registrar un ingreso',
        descripcion: 'Tocá "Nuevo Ingreso". Ingresá el DNI con el teclado numérico grande. Si la persona ya visitó antes, los datos se completan solos. Pedile que firme en la pantalla.',
      },
      {
        emoji: '✅',
        titulo: 'Registrar una salida',
        descripcion: 'Tocá "Marcar Salida". Buscá a la persona por nombre o usá el modo DNI. Antes de salir, la persona debe firmar la columna NO o SÍ de la declaración de incidente.',
      },
      {
        emoji: '⚠️',
        titulo: 'Si hubo un incidente',
        descripcion: 'Si la persona firma la columna SÍ, completá el formulario de incidente con los detalles. El administrador recibirá una notificación automática.',
      },
      {
        emoji: '📡',
        titulo: 'Sin internet',
        descripcion: 'El sistema funciona sin conexión. Los registros se guardan en la tablet y se sincronizan automáticamente cuando vuelve la señal. El banner naranja indica cuántos registros están en cola.',
      },
      {
        emoji: '📍',
        titulo: 'Configurar ubicación',
        descripcion: 'Si es la primera vez que usás esta tablet en este equipo, tocá el ícono de configuración y usá el GPS para registrar la ubicación del equipo.',
      },
    ],
  },

  admin: {
    bienvenida: 'Bienvenido al panel de administración de WELL LOG',
    pasos: [
      {
        emoji: '📊',
        titulo: 'Dashboard',
        descripcion: 'El dashboard muestra en tiempo real cuántas personas están dentro de todos tus equipos, los ingresos del día y los incidentes pendientes.',
      },
      {
        emoji: '⚙️',
        titulo: 'Configurar equipos',
        descripcion: 'En "Equipos" creás y configurás tus equipos de trabajo. Asigná un operador a cada equipo para que pueda usar la tablet en campo.',
      },
      {
        emoji: '👥',
        titulo: 'Gestionar usuarios',
        descripcion: 'En "Usuarios" invitás a tu equipo. Ingresá el email y el sistema envía una invitación. El usuario elige su contraseña al activar la cuenta.',
      },
      {
        emoji: '🗺️',
        titulo: 'Mapa de equipos',
        descripcion: 'El mapa muestra todos tus equipos con su ubicación GPS y cuántas personas hay dentro. Los pins cambian de color según el estado del equipo.',
      },
      {
        emoji: '📋',
        titulo: 'Registros',
        descripcion: 'En "Registros" ves el historial completo de ingresos y egresos. Podés filtrar por equipo, fecha y buscar por nombre o DNI. Exportá a Excel o descargá el PDF de cada registro.',
      },
      {
        emoji: '🛡️',
        titulo: 'Dar acceso a YPF u otras operadoras',
        descripcion: 'En "Auditores" habilitás el acceso de las operadoras (YPF, TotalEnergies, etc.) para que puedan ver tus registros. Controlás exactamente qué pueden ver y por cuánto tiempo.',
      },
    ],
  },

  auditor: {
    bienvenida: 'Bienvenido al panel de auditoría de WELL LOG',
    pasos: [
      {
        emoji: '👁️',
        titulo: 'Acceso de solo lectura',
        descripcion: 'Como auditor tenés acceso de solo lectura a los equipos que la empresa contratista autorizó. No podés modificar ningún dato.',
      },
      {
        emoji: '🗺️',
        titulo: 'Mapa de equipos',
        descripcion: 'El mapa muestra los equipos autorizados con ubicaciones aproximadas (±500m por privacidad). Ves cuántas personas hay dentro en tiempo real.',
      },
      {
        emoji: '⚠️',
        titulo: 'Incidentes',
        descripcion: 'Si tenés permiso para ver incidentes, en esta sección ves todas las declaraciones HSE de los equipos autorizados con su estado de investigación.',
      },
      {
        emoji: '📥',
        titulo: 'Exportar reportes',
        descripcion: 'En "Reportes" podés exportar los registros de acceso en formato CSV para el período que necesites. Filtrá por equipo y fecha.',
      },
    ],
  },

  superadmin: {
    bienvenida: 'Bienvenido al panel de administración de la plataforma WELL LOG',
    pasos: [
      {
        emoji: '🏢',
        titulo: 'Gestión de empresas',
        descripcion: 'En "Empresas" creás y gestionás todas las contratistas y operadoras de la plataforma. Asignás el plan (Free/Pro/Enterprise) a cada empresa.',
      },
      {
        emoji: '👤',
        titulo: 'Gestión de usuarios',
        descripcion: 'En "Usuarios" ves todos los usuarios de la plataforma. Podés crear usuarios para cualquier empresa, cambiar roles y suspender cuentas.',
      },
      {
        emoji: '🔐',
        titulo: 'Permisos de acceso',
        descripcion: 'En "Permisos" configurás qué contratistas comparten datos con qué operadoras. Cada relación es independiente y revocable.',
      },
      {
        emoji: '📈',
        titulo: 'Métricas globales',
        descripcion: 'En "Métricas" ves la actividad de toda la plataforma: registros por día, incidentes por mes, distribución de empresas y usuarios.',
      },
      {
        emoji: '🔧',
        titulo: 'Soporte y backups',
        descripcion: 'En "Soporte" monitoreás el estado del sistema, ejecutás backups manuales y ves la actividad por empresa para diagnosticar problemas.',
      },
      {
        emoji: '⚙️',
        titulo: 'Configuración',
        descripcion: 'En "Configuración" ves las variables de entorno activas, los feature flags y el estado de la base de datos. Para cambiar algo, actualizá las variables en Vercel.',
      },
    ],
  },
}

const STORAGE_KEY = 'welllog_onboarding_v1'

function getCompletados(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch { return [] }
}

function marcarCompletado(rol: string) {
  try {
    const completados = getCompletados()
    if (!completados.includes(rol)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completados, rol]))
    }
  } catch {}
}

interface OnboardingGuideProps {
  rol: Rol
  /** Si es true, muestra el modal aunque ya se haya visto (para el botón de ayuda) */
  forzar?: boolean
  onClose?: () => void
}

export function OnboardingGuide({ rol, forzar = false, onClose }: OnboardingGuideProps) {
  const guia = GUIAS[rol]
  const [visible, setVisible] = useState(false)
  const [paso, setPaso] = useState(0)

  useEffect(() => {
    if (!guia) return
    if (forzar) { setVisible(true); setPaso(0); return }
    const completados = getCompletados()
    if (!completados.includes(rol)) {
      // Pequeño delay para no interrumpir la carga inicial
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [rol, forzar, guia])

  if (!guia || !visible) return null

  const pasoActual = guia.pasos[paso]
  const esUltimo = paso === guia.pasos.length - 1

  const cerrar = () => {
    marcarCompletado(rol)
    setVisible(false)
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={cerrar} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-[var(--card-bg)] rounded-t-[24px] sm:rounded-[24px] shadow-clay-lg animate-slide-up overflow-hidden">

        {/* Header con progreso */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {paso + 1} de {guia.pasos.length}
            </span>
            <button onClick={cerrar} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-muted)]">
              <X size={16} />
            </button>
          </div>

          {/* Barra de progreso */}
          <div className="flex gap-1 mb-4">
            {guia.pasos.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ background: i <= paso ? '#7F77DD' : 'var(--border-strong)' }}
              />
            ))}
          </div>

          {/* Bienvenida solo en el primer paso */}
          {paso === 0 && (
            <p className="text-xs text-[var(--text-muted)] mb-3">{guia.bienvenida}</p>
          )}
        </div>

        {/* Contenido del paso */}
        <div className="px-5 pb-5">
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="text-5xl">{pasoActual.emoji}</div>
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                {pasoActual.titulo}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {pasoActual.descripcion}
              </p>
            </div>
          </div>

          {/* Navegación */}
          <div className="flex items-center gap-3 mt-4">
            {paso > 0 && (
              <button
                onClick={() => setPaso(p => p - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
            )}

            <button
              onClick={() => {
                if (esUltimo) cerrar()
                else setPaso(p => p + 1)
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-clay text-white text-sm font-medium transition-all active:scale-98"
              style={{ background: 'var(--btn-ingreso)' }}
            >
              {esUltimo ? (
                <>
                  <CheckCircle2 size={16} />
                  Entendido, empezar
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Saltar */}
          {!esUltimo && (
            <button
              onClick={cerrar}
              className="w-full text-center text-xs text-[var(--text-faded)] hover:text-[var(--text-muted)] mt-3 transition-colors"
            >
              Saltar guía
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook para usar el botón de ayuda desde cualquier componente
export function useOnboardingGuide() {
  const [mostrar, setMostrar] = useState(false)
  return {
    mostrar,
    abrir: () => setMostrar(true),
    cerrar: () => setMostrar(false),
  }
}
