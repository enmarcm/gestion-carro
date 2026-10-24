export interface FuelEntry {
  id: number
  filledOn: string // YYYY-MM-DD
  odometerKm: number
  liters: number
  totalUsd: number
  fullTank: boolean
}

export interface FuelMetrics extends FuelEntry {
  distanceKm: number | null // km desde la carga anterior
  days: number | null // días desde la carga anterior
  kmPerLiter: number | null // rendimiento entre llenados completos
  litersPer100: number | null
  costPerKm: number | null // USD por km: costo de esta carga / km recorridos desde la anterior
}

const DAY = 86_400_000

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY)
}

/** Métricas por carga, en orden cronológico (km, luego fecha). */
export function fuelMetrics(entries: FuelEntry[]): FuelMetrics[] {
  const sorted = [...entries].sort(
    (a, b) => a.odometerKm - b.odometerKm || a.filledOn.localeCompare(b.filledOn) || a.id - b.id,
  )
  const out: FuelMetrics[] = []
  let lastFullKm: number | null = null
  let litersSinceFull = 0
  sorted.forEach((e, i) => {
    const prev = sorted[i - 1]
    const distanceKm = prev ? e.odometerKm - prev.odometerKm : null
    const days = prev ? daysBetween(prev.filledOn, e.filledOn) : null
    let kmPerLiter: number | null = null
    if (lastFullKm !== null) litersSinceFull += e.liters
    if (e.fullTank) {
      if (lastFullKm !== null && litersSinceFull > 0 && e.odometerKm > lastFullKm) {
        kmPerLiter = (e.odometerKm - lastFullKm) / litersSinceFull
      }
      lastFullKm = e.odometerKm
      litersSinceFull = 0
    }
    out.push({
      ...e,
      distanceKm,
      days,
      kmPerLiter,
      litersPer100: kmPerLiter ? 100 / kmPerLiter : null,
      costPerKm: distanceKm && distanceKm > 0 ? e.totalUsd / distanceKm : null,
    })
  })
  return out
}

export interface FuelSummary {
  count: number
  totalLiters: number
  totalUsd: number
  avgKmPerLiter: number | null
  lastKmPerLiter: number | null
  avgCostPerKm: number | null
  avgDaysBetween: number | null
  totalKm: number
}

export function fuelSummary(metrics: FuelMetrics[]): FuelSummary {
  const withEff = metrics.filter((m) => m.kmPerLiter !== null)
  const totalLiters = metrics.reduce((s, m) => s + m.liters, 0)
  const totalUsd = metrics.reduce((s, m) => s + m.totalUsd, 0)
  const first = metrics[0]
  const last = metrics[metrics.length - 1]
  const totalKm = first && last ? last.odometerKm - first.odometerKm : 0
  const gaps = metrics.map((m) => m.days).filter((d): d is number => d !== null)
  // Costo/km: gasto de todas las cargas salvo la primera (que repone lo anterior) / km recorridos.
  const spendAfterFirst = metrics.slice(1).reduce((s, m) => s + m.totalUsd, 0)
  return {
    count: metrics.length,
    totalLiters,
    totalUsd,
    avgKmPerLiter: withEff.length ? withEff.reduce((s, m) => s + (m.kmPerLiter ?? 0), 0) / withEff.length : null,
    lastKmPerLiter: withEff.length ? (withEff[withEff.length - 1]?.kmPerLiter ?? null) : null,
    avgCostPerKm: totalKm > 0 ? spendAfterFirst / totalKm : null,
    avgDaysBetween: gaps.length ? gaps.reduce((s, d) => s + d, 0) / gaps.length : null,
    totalKm,
  }
}

export type DueStatus = 'overdue' | 'soon' | 'ok'

export interface DueInput {
  nextKm: number | null
  nextDate: string | null
}
export interface DueResult {
  status: DueStatus
  kmLeft: number | null
  daysLeft: number | null
}

export function dueStatus(input: DueInput, odometerKm: number, today: string, warnKm = 500, warnDays = 15): DueResult {
  const kmLeft = input.nextKm !== null ? input.nextKm - odometerKm : null
  const daysLeft = input.nextDate !== null ? daysBetween(today, input.nextDate) : null
  let status: DueStatus = 'ok'
  if ((kmLeft !== null && kmLeft <= 0) || (daysLeft !== null && daysLeft <= 0)) status = 'overdue'
  else if ((kmLeft !== null && kmLeft <= warnKm) || (daysLeft !== null && daysLeft <= warnDays)) status = 'soon'
  return { status, kmLeft, daysLeft }
}

/** % del intervalo ya consumido (el mayor entre km y tiempo). null si no hay intervalo calculable. */
export function dueProgress(
  i: { lastKm: number; lastOn: string; nextKm: number | null; nextDate: string | null },
  odometerKm: number,
  today: string,
): number | null {
  const parts: number[] = []
  if (i.nextKm !== null && i.nextKm > i.lastKm) parts.push((odometerKm - i.lastKm) / (i.nextKm - i.lastKm))
  if (i.nextDate !== null) {
    const total = daysBetween(i.lastOn, i.nextDate)
    if (total > 0) parts.push(daysBetween(i.lastOn, today) / total)
  }
  if (!parts.length) return null
  return Math.max(0, Math.min(1, Math.max(...parts))) * 100
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(date + 'T00:00:00Z') + days * DAY).toISOString().slice(0, 10)
}

/** Próximo vencimiento sugerido a partir del intervalo del tipo de servicio. */
export function suggestNext(
  performedOn: string,
  odometerKm: number,
  intervalKm: number | null,
  intervalDays: number | null,
): DueInput {
  return {
    nextKm: intervalKm ? odometerKm + intervalKm : null,
    nextDate: intervalDays ? addDays(performedOn, intervalDays) : null,
  }
}
