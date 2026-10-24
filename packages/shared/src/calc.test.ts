import { describe, expect, it } from 'vitest'
import { dueStatus, fuelMetrics, fuelSummary, suggestNext } from './calc'

describe('fuelMetrics', () => {
  const base = [
    { id: 1, filledOn: '2026-01-01', odometerKm: 1000, liters: 30, totalUsd: 15, fullTank: true },
    { id: 2, filledOn: '2026-01-10', odometerKm: 1300, liters: 25, totalUsd: 12.5, fullTank: true },
    { id: 3, filledOn: '2026-01-18', odometerKm: 1450, liters: 10, totalUsd: 5, fullTank: false },
    { id: 4, filledOn: '2026-01-25', odometerKm: 1600, liters: 20, totalUsd: 10, fullTank: true },
  ]
  it('km/L entre llenados completos', () => {
    const m = fuelMetrics(base)
    expect(m[0]?.kmPerLiter).toBeNull()
    expect(m[1]?.kmPerLiter).toBeCloseTo(300 / 25)
    expect(m[2]?.kmPerLiter).toBeNull()
    expect(m[3]?.kmPerLiter).toBeCloseTo(300 / 30)
  })
  it('distancia y días desde la carga anterior', () => {
    const m = fuelMetrics(base)
    expect(m[1]?.distanceKm).toBe(300)
    expect(m[1]?.days).toBe(9)
  })
  it('resumen', () => {
    const s = fuelSummary(fuelMetrics(base))
    expect(s.totalKm).toBe(600)
    expect(s.avgKmPerLiter).toBeCloseTo(11)
    expect(s.avgCostPerKm).toBeCloseTo(27.5 / 600)
  })
  it('vacío', () => {
    expect(fuelSummary([]).count).toBe(0)
  })
})

describe('dueStatus', () => {
  it('vencido por km', () => {
    expect(dueStatus({ nextKm: 5000, nextDate: null }, 5100, '2026-01-01').status).toBe('overdue')
  })
  it('pronto por fecha', () => {
    expect(dueStatus({ nextKm: null, nextDate: '2026-01-10' }, 0, '2026-01-01').status).toBe('soon')
  })
  it('ok', () => {
    expect(dueStatus({ nextKm: 9000, nextDate: '2027-01-01' }, 5000, '2026-01-01').status).toBe('ok')
  })
})

describe('suggestNext', () => {
  it('suma intervalos', () => {
    expect(suggestNext('2026-01-01', 10000, 4500, 180)).toEqual({ nextKm: 14500, nextDate: '2026-06-30' })
  })
})
