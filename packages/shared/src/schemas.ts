import { z } from 'zod'

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
const km = z
  .number({ error: 'Número requerido' })
  .int('Debe ser entero')
  .min(0, 'No puede ser negativo')
  .max(2_000_000, 'Valor demasiado alto')
const money = z.number({ error: 'Número requerido' }).min(0, 'No puede ser negativo').max(1_000_000, 'Valor demasiado alto')
const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`)

export const loginSchema = z.object({ password: z.string().min(1, 'Ingresa tu clave').max(128) })
export const changePasswordSchema = z.object({
  current: z.string().min(1, 'Requerido').max(128),
  next: z.string().min(6, 'Mínimo 6 caracteres').max(128),
})

export const vehicleSchema = z.object({
  brand: text(40).min(1, 'Requerido'),
  model: text(40).min(1, 'Requerido'),
  year: z.number({ error: 'Número requerido' }).int().min(1950, 'Año inválido').max(2100, 'Año inválido'),
  color: text(30),
  plate: text(15),
  odometerKm: km,
})

export const maintenanceInput = z.object({
  serviceTypeId: z.number({ error: 'Elige un servicio' }).int().positive('Elige un servicio'),
  detail: text(120).default(''),
  performedOn: date,
  odometerKm: km,
  costUsd: money.nullable().default(null),
  shop: text(80).default(''),
  notes: text(500).default(''),
  nextKm: km.nullable().default(null),
  nextDate: date.nullable().default(null),
})
export type MaintenanceInput = z.infer<typeof maintenanceInput>

export const fuelInput = z.object({
  filledOn: date,
  odometerKm: km,
  liters: z.number({ error: 'Número requerido' }).positive('Debe ser mayor a 0').max(200, 'Valor demasiado alto'),
  pricePerLiterUsd: z.number().min(0).max(1000).nullable().default(null),
  totalUsd: money,
  fullTank: z.boolean().default(true),
  notes: text(300).default(''),
})
export type FuelInput = z.infer<typeof fuelInput>

export const serviceTypeInput = z.object({
  categoryId: z.number().int().positive(),
  name: text(80).min(1, 'Requerido'),
  intervalKm: km.nullable().default(null),
  intervalDays: z.number().int().min(1, 'Mínimo 1').max(36500).nullable().default(null),
  note: text(200).default(''),
})
export const serviceTypePatch = z.object({
  name: text(80).min(1, 'Requerido').optional(),
  intervalKm: km.nullable().optional(),
  intervalDays: z.number().int().min(1, 'Mínimo 1').max(36500).nullable().optional(),
  note: text(200).optional(),
})

export const categoryInput = z.object({
  name: text(40).min(1, 'Requerido'),
  icon: text(30).default('Wrench'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#10b981'),
})

export const settingsPatch = z.object({
  warnKm: km.optional(),
  warnDays: z.number().int().min(0).max(365).optional(),
})

export const listQuery = z.object({
  q: z.string().trim().max(60).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  serviceTypeId: z.coerce.number().int().positive().optional(),
  from: date.optional(),
  to: date.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
})

export const idParam = z.object({ id: z.coerce.number().int().positive() })

// --- Tipos de respuesta ---
export interface Vehicle { brand: string; model: string; year: number; color: string; plate: string; odometerKm: number; odometerDate: string }
export interface ServiceType { id: number; categoryId: number; name: string; intervalKm: number | null; intervalDays: number | null; note: string; builtin: boolean }
export interface Category { id: number; slug: string; name: string; icon: string; color: string; builtin: boolean; types: ServiceType[] }
export interface Fx { rate: number; sourceDate: string; stale: boolean }
export interface AppSettings { warnKm: number; warnDays: number }
export interface MaintenanceLog {
  id: number; serviceTypeId: number; serviceName: string; categoryId: number; categoryName: string; categoryIcon: string; categoryColor: string
  detail: string; performedOn: string; odometerKm: number; costUsd: number | null; fxRate: number | null
  shop: string; notes: string; nextKm: number | null; nextDate: string | null
}
export interface FuelLog { id: number; filledOn: string; odometerKm: number; liters: number; pricePerLiterUsd: number | null; totalUsd: number; fullTank: boolean; notes: string }
export interface DueItem {
  serviceTypeId: number; serviceName: string; categoryId: number; categoryName: string; categoryIcon: string; categoryColor: string
  lastOn: string; lastKm: number; nextKm: number | null; nextDate: string | null
  status: 'overdue' | 'soon' | 'ok'; kmLeft: number | null; daysLeft: number | null
}
export interface Bootstrap { vehicle: Vehicle; categories: Category[]; fx: Fx | null; settings: AppSettings; today: string }
export interface Stats {
  byCategory: { categoryId: number; name: string; color: string; totalUsd: number; count: number }[]
  byMonth: { month: string; maintenanceUsd: number; fuelUsd: number }[]
  totals: { maintenanceUsd: number; fuelUsd: number; logs: number }
}
