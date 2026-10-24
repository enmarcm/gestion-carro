const nf = (min: number, max: number) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: min, maximumFractionDigits: max })
const f0 = nf(0, 0), f1 = nf(0, 1), f2 = nf(2, 2)

export const fmtKm = (n: number | null | undefined) => (n == null ? '—' : `${f0.format(n)} km`)
export const fmtNum = (n: number | null | undefined, d = 1) => (n == null ? '—' : nf(0, d).format(n))
export const fmtUsd = (n: number | null | undefined) => (n == null ? '—' : `$${f2.format(n)}`)
export const fmtBs = (usd: number | null | undefined, rate: number | null | undefined) =>
  usd == null || !rate ? '' : `Bs ${f2.format(usd * rate)}`
export const fmtL = (n: number | null | undefined) => (n == null ? '—' : `${f1.format(n)} L`)

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export function fmtDate(iso: string | null | undefined, withYear = true): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`
}
export const fmtMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number)
  return m ? `${MONTHS[m - 1]} ${String(y).slice(2)}` : ym
}

/** Texto decimal (acepta coma) -> number | null (vacío) | NaN (inválido). */
export function toNum(s: string): number | null {
  const t = s.trim().replace(/\s/g, '').replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : NaN
}
export const numStr = (n: number | null | undefined) => (n == null ? '' : String(n))
