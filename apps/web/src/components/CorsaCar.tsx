/** Ilustración propia: Chevrolet Corsa 2001, 2 puertas, verde (vista lateral, frente a la derecha). */
export function CorsaCar({ className }: { className?: string }) {
  return (
    <svg viewBox="-130 -62 260 112" className={className} role="img" aria-label="Chevrolet Corsa verde de 2 puertas">
      <defs>
        <linearGradient id="cb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fbf82" />
          <stop offset="1" stopColor="#1f8a5b" />
        </linearGradient>
        <linearGradient id="cr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#62d6a0" />
          <stop offset="1" stopColor="#39b87d" />
        </linearGradient>
        <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e3f3fc" />
          <stop offset="1" stopColor="#b7dcf2" />
        </linearGradient>
        <filter id="csh" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#2a4660" floodOpacity="0.28" />
        </filter>
      </defs>
      <ellipse cx="0" cy="46" rx="108" ry="6" fill="#2a4660" opacity="0.14" />
      <g filter="url(#csh)" strokeLinejoin="round" strokeLinecap="round">
        <path d="M-108 24V-2l12-7 56-4h100l40 7 10 12v18z" fill="url(#cb)" stroke="#2fa36b" strokeWidth="8" />
        <path d="M-88-9l16-31 50-7 46 2 28 32z" fill="url(#cr)" stroke="#4cc58a" strokeWidth="6" />
        <path d="M-76-13l14-23 40-5 40 1 20 27z" fill="url(#cg)" stroke="#cfe9f7" strokeWidth="3" />
        <path d="M-8-42v29" stroke="#4cc58a" strokeWidth="5" fill="none" />
        <path d="M2-10v31" stroke="#1f7a50" strokeWidth="2.5" opacity="0.8" fill="none" />
        <path d="M-12-4h10" stroke="#1f7a50" strokeWidth="3" fill="none" />
        <path d="M-104 22h210" stroke="#1f7a50" strokeWidth="6" fill="none" opacity="0.7" />
        <path d="M100 20h12" stroke="#cbd5e1" strokeWidth="5" fill="none" />
        <rect x="100" y="-5" width="10" height="8" rx="3" fill="#fde68a" stroke="#fde68a" strokeWidth="2" />
        <rect x="-110" y="-2" width="6" height="10" rx="2" fill="#ef4444" stroke="#ef4444" strokeWidth="2" />
        <path d="M-80 -20h28" stroke="#fff" strokeWidth="3" opacity="0.35" fill="none" />
      </g>
      {[-66, 62].map((x) => (
        <g key={x} transform={`translate(${x} 24)`}>
          <circle r="23" fill="#1b2a3b" opacity="0.35" />
          <circle r="20" fill="#1e293b" />
          <circle r="12" fill="#e2e8f0" />
          <path d="M-10 0h20M0-10v20M-7-7l14 14M7-7l-14 14" stroke="#94a3b8" strokeWidth="2" />
          <circle r="4" fill="#475569" />
        </g>
      ))}
    </svg>
  )
}
