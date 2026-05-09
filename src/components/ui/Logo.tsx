import { useId } from 'react'

interface LogoProps {
  size?: number
  className?: string
}

// Torre de perforación (derrick) — logo WELL LOG
// Diseño más limpio: estructura triangular con travesaños y cabezal
export function Logo({ size = 32, className = '' }: LogoProps) {
  const uid = useId().replace(/:/g, '')
  const g1 = `lg1-${uid}`
  const g2 = `lg2-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WELL LOG"
    >
      <defs>
        {/* Fondo: gradiente violeta */}
        <linearGradient id={g1} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B83E8" />
          <stop offset="100%" stopColor="#4F46B8" />
        </linearGradient>
        {/* Brillo sutil en la torre */}
        <linearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="100%" stopColor="white" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Fondo redondeado */}
      <rect width="40" height="40" rx="10" fill={`url(#${g1})`} />

      {/* Sombra interna sutil */}
      <rect width="40" height="40" rx="10" fill="black" fillOpacity="0.06" />

      {/* ── TORRE DE PERFORACIÓN ── */}

      {/* Patas externas (A-frame) */}
      <path
        d="M9 33 L20 7 L31 33"
        stroke={`url(#${g2})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Travesaño 1 (alto) */}
      <line x1="14.5" y1="16" x2="25.5" y2="16" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />

      {/* Travesaño 2 (medio) */}
      <line x1="12.5" y1="22" x2="27.5" y2="22" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />

      {/* Travesaño 3 (bajo) */}
      <line x1="10.5" y1="28" x2="29.5" y2="28" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />

      {/* Diagonales panel superior (X) */}
      <line x1="14.5" y1="16" x2="25.5" y2="22" stroke="white" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.45" />
      <line x1="25.5" y1="16" x2="14.5" y2="22" stroke="white" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.45" />

      {/* Diagonales panel inferior (X) */}
      <line x1="12.5" y1="22" x2="29.5" y2="28" stroke="white" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.45" />
      <line x1="27.5" y1="22" x2="10.5" y2="28" stroke="white" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.45" />

      {/* Crown block (cabezal) — rectángulo en el vértice */}
      <rect x="17" y="5.5" width="6" height="2.5" rx="1" fill="white" fillOpacity="0.95" />

      {/* Plataforma base */}
      <rect x="8" y="32" width="24" height="2.5" rx="1.2" fill="white" fillOpacity="0.85" />

      {/* Punto central del crown (polea) */}
      <circle cx="20" cy="6.75" r="1" fill={`url(#${g1})`} />
    </svg>
  )
}
