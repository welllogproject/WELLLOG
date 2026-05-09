interface LogoProps {
  size?: number
  className?: string
}

// Derrick (torre de perforación) — logo oficial WELL LOG
export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WELL LOG"
    >
      <defs>
        <linearGradient id={`logo-grad-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7F77DD" />
          <stop offset="100%" stopColor="#534AB7" />
        </linearGradient>
      </defs>

      {/* Fondo cuadrado redondeado */}
      <rect x="2" y="2" width="28" height="28" rx="7" fill={`url(#logo-grad-${size})`} />

      {/* Crown block (cabezal de la torre) */}
      <rect x="13.5" y="5" width="5" height="2.2" rx="0.5" fill="white" />

      {/* Patas de la torre (tapered legs) */}
      <path
        d="M10 25 L14 7.5 M22 25 L18 7.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Travesaños horizontales */}
      <line x1="13" y1="12" x2="19" y2="12" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="17" x2="20" y2="17" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="22" x2="21" y2="22" stroke="white" strokeWidth="1.2" strokeLinecap="round" />

      {/* Cruzados X en cada panel */}
      <path
        d="M13.4 12 L19.6 17 M18.6 12 L12.4 17"
        stroke="white"
        strokeWidth="1"
        opacity="0.65"
        strokeLinecap="round"
      />
      <path
        d="M12.2 17 L20.8 22 M19.8 17 L11.2 22"
        stroke="white"
        strokeWidth="1"
        opacity="0.65"
        strokeLinecap="round"
      />

      {/* Piso del equipo */}
      <rect x="9" y="24.8" width="14" height="1.8" rx="0.5" fill="white" />
    </svg>
  )
}
