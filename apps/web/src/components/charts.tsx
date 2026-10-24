import { useId } from 'react'
import { fmtMonth } from '../lib/format'

/** Anillo neumórfico con degradado (como la referencia). */
export function Ring({ value, label, size = 168, from = '#7c8cf0', to = '#a45fd0', glow = 'rgba(164,95,208,.35)' }: { value: number; label?: string; size?: number; from?: string; to?: string; glow?: string }) {
  const id = useId()
  const v = Math.max(0, Math.min(100, value))
  const r = 44, c = 2 * Math.PI * r
  return (
    <div className="neu-in relative grid place-items-center" style={{ width: size, height: size, borderRadius: '50%', boxShadow: `inset 6px 6px 14px rgba(150,180,212,.55), inset -6px -6px 14px #fff, 0 0 28px ${glow}` }}>
      <svg viewBox="0 0 100 100" width={size - 22} height={size - 22} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#cfdeee" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(c * v) / 100} ${c}`} style={{ transition: 'stroke-dasharray .9s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="absolute grid place-items-center text-center">
        <span className="text-[30px] font-bold leading-none">{Math.round(v)}%</span>
        {label && <span className="mt-1 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">{label}</span>}
      </div>
    </div>
  )
}

/** Barras tipo píldora por mes (mantenimiento + gasolina apilados). */
export function MonthBars({ data }: { data: { month: string; maintenanceUsd: number; fuelUsd: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.maintenanceUsd + d.fuelUsd))
  return (
    <div className="flex items-end justify-between gap-2 overflow-x-auto pb-1" role="img" aria-label="Gasto mensual">
      {data.map((d) => {
        const mh = (d.maintenanceUsd / max) * 100
        const fh = (d.fuelUsd / max) * 100
        return (
          <div key={d.month} className="flex min-w-[34px] flex-1 flex-col items-center gap-2">
            <div className="neu-in relative flex h-[150px] w-[30px] flex-col justify-end overflow-hidden p-[3px]" style={{ borderRadius: 999 }}>
              <div className="w-full" style={{ height: `${fh}%`, background: 'linear-gradient(180deg,#ff8ec0,#f0627e)', borderRadius: 999, minHeight: fh > 0 ? 6 : 0 }} />
              <div className="mt-[2px] w-full" style={{ height: `${mh}%`, background: 'linear-gradient(180deg,#5ac8f5,#4a8cf0)', borderRadius: 999, minHeight: mh > 0 ? 6 : 0 }} />
            </div>
            <span className="text-[10px] font-bold text-[var(--muted)]">{fmtMonth(d.month)}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Línea simple de tendencia (km/L). */
export function Trend({ points, color = '#1f9d6b' }: { points: number[]; color?: string }) {
  const id = useId()
  if (points.length < 2) return null
  const w = 300, h = 90, pad = 8
  const min = Math.min(...points), max = Math.max(...points)
  const span = max - min || 1
  const xy = points.map((p, i) => [pad + (i * (w - pad * 2)) / (points.length - 1), h - pad - ((p - min) / span) * (h - pad * 2)] as const)
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${d} L${xy[xy.length - 1]![0]} ${h} L${xy[0]![0]} ${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Tendencia de rendimiento">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 4.5 : 2.5} fill={i === xy.length - 1 ? color : '#fff'} stroke={color} strokeWidth="2" />)}
    </svg>
  )
}

/** Barra horizontal de reparto con color de categoría. */
export function ShareBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="neu-in h-3 w-full overflow-hidden p-[2px]" style={{ borderRadius: 999 }}>
      <div className="h-full" style={{ width: `${Math.max(3, Math.min(100, pct))}%`, background: color, borderRadius: 999, transition: 'width .6s ease' }} />
    </div>
  )
}

/** Progreso hacia el próximo cambio: color según urgencia. */
export function ProgressBar({ pct, status }: { pct: number; status: 'overdue' | 'soon' | 'ok' }) {
  const bg = status === 'overdue' ? 'linear-gradient(90deg,#f97316,#ef4444)' : status === 'soon' ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#3ccf94,#1f9d6b)'
  return (
    <div className="neu-in h-3 w-full overflow-hidden p-[2px]" style={{ borderRadius: 999 }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full" style={{ width: `${Math.max(4, Math.min(100, pct))}%`, background: bg, borderRadius: 999, transition: 'width .6s ease' }} />
    </div>
  )
}
