import Fastify, { type FastifyInstance } from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import { ZodError, type ZodType } from 'zod'
import {
  categoryInput, changePasswordSchema, dueStatus, fuelInput, fuelMetrics, fuelSummary, idParam, listQuery,
  loginSchema, maintenanceInput, serviceTypeInput, serviceTypePatch, settingsPatch, vehicleSchema,
  type AppSettings, type Bootstrap, type Category, type DueItem, type FuelLog, type MaintenanceLog, type ServiceType, type Stats, type Vehicle,
} from '@carro/shared'
import { config } from './config.js'
import type { Sql } from './db.js'
import { COOKIE, getAuthState, setPassword, signToken, verifyPassword, verifyToken } from './auth.js'
import { getFx } from './fx.js'

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const parse = <T>(schema: ZodType<T>, data: unknown): T => schema.parse(data)
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })

export interface AppDeps {
  sql: Sql
  secret: string
  origin: string
  secureCookie: boolean
}

export async function buildApp({ sql, secret, origin, secureCookie }: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: 'info', redact: ['req.headers.cookie', 'req.headers.authorization'] }, trustProxy: true, bodyLimit: 100 * 1024 })

  await app.register(helmet, {
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
  await app.register(cors, {
    origin: [origin],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['content-type', 'x-requested-with'],
    maxAge: 600,
  })
  await app.register(cookie)
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' })

  app.setErrorHandler((err: Error & { statusCode?: number }, req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({ error: 'validation', issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) })
    }
    if (err instanceof HttpError) return reply.code(err.status).send({ error: err.message })
    const code = err.statusCode && err.statusCode < 500 ? err.statusCode : 500
    if (code === 500) req.log.error(err)
    return reply.code(code).send({ error: code === 429 ? 'Demasiados intentos' : code === 500 ? 'Error interno' : 'Solicitud inválida' })
  })
  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: 'No encontrado' }))

  // --- Públicas ---
  app.get('/health', async () => ({ status: 'ok' }))
  app.get('/ready', async (_req, reply) => {
    try {
      await sql`select 1`
      return { status: 'ready' }
    } catch {
      return reply.code(503).send({ status: 'unavailable' })
    }
  })

  const setSession = (reply: import('fastify').FastifyReply, ver: number) =>
    reply.setCookie(COOKIE, signToken(secret, ver, config.sessionDays * 86400), {
      httpOnly: true, secure: secureCookie, sameSite: 'strict', path: '/', maxAge: config.sessionDays * 86400,
    })

  app.post('/auth/login', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (req, reply) => {
    const { password } = parse(loginSchema, req.body)
    const st = await getAuthState(sql)
    if (!(await verifyPassword(st.hash, password))) throw new HttpError(401, 'Clave incorrecta')
    setSession(reply, st.ver)
    return { ok: true }
  })

  // --- Todo lo demás exige sesión + header anti-CSRF (deny-by-default) ---
  await app.register(async (priv) => {
    priv.addHook('onRequest', async (req) => {
      const st = await getAuthState(sql)
      if (!verifyToken(secret, req.cookies[COOKIE], st.ver)) throw new HttpError(401, 'No autorizado')
      if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'carro') throw new HttpError(403, 'Solicitud rechazada')
    })

    priv.get('/auth/me', async () => ({ ok: true }))
    priv.post('/auth/logout', async (_req, reply) => {
      reply.clearCookie(COOKIE, { path: '/' })
      return { ok: true }
    })
    priv.post('/auth/password', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (req, reply) => {
      const body = parse(changePasswordSchema, req.body)
      const st = await getAuthState(sql)
      if (!(await verifyPassword(st.hash, body.current))) throw new HttpError(401, 'Clave actual incorrecta')
      await setPassword(sql, body.next, true)
      const after = await getAuthState(sql)
      setSession(reply, after.ver)
      return { ok: true }
    })

    const loadSettings = async (): Promise<AppSettings> => {
      const [r] = await sql<{ value: AppSettings }[]>`select value from settings where key = 'warn'`
      return r?.value ?? { warnKm: 500, warnDays: 15 }
    }
    const loadVehicle = async (): Promise<Vehicle> => {
      const [v] = await sql<Vehicle[]>`select brand, model, year, color, plate, odometer_km, odometer_date from vehicle where id = 1`
      if (!v) throw new HttpError(500, 'Vehículo no configurado')
      return v
    }
    const loadCategories = async (): Promise<Category[]> => {
      const cats = await sql<Omit<Category, 'types'>[]>`select id, slug, name, icon, color, builtin from categories order by sort, id`
      const types = await sql<ServiceType[]>`select id, category_id, name, interval_km, interval_days, note, builtin from service_types order by sort, id`
      return cats.map((c) => ({ ...c, types: types.filter((t) => t.categoryId === c.id) }))
    }
    const bumpOdometer = async (km: number, on: string) => {
      await sql`update vehicle set odometer_km = ${km}, odometer_date = ${on} where id = 1 and odometer_km < ${km}`
    }

    priv.get('/bootstrap', async (): Promise<Bootstrap> => {
      const [vehicle, categories, fx, settings] = await Promise.all([loadVehicle(), loadCategories(), getFx(sql), loadSettings()])
      return { vehicle, categories, fx, settings, today: todayStr() }
    })
    priv.get('/fx', async () => ({ fx: await getFx(sql) }))

    priv.put('/vehicle', async (req) => {
      const v = parse(vehicleSchema, req.body)
      await sql`
        update vehicle set brand = ${v.brand}, model = ${v.model}, year = ${v.year}, color = ${v.color}, plate = ${v.plate},
          odometer_km = ${v.odometerKm}, odometer_date = case when odometer_km <> ${v.odometerKm} then ${todayStr()}::date else odometer_date end
        where id = 1`
      return loadVehicle()
    })

    priv.patch('/settings', async (req) => {
      const patch = parse(settingsPatch, req.body)
      const next = { ...(await loadSettings()), ...patch }
      await sql`insert into settings (key, value) values ('warn', ${sql.json(next)}) on conflict (key) do update set value = excluded.value`
      return next
    })

    // --- Categorías y tipos de servicio ---
    priv.post('/categories', async (req) => {
      const c = parse(categoryInput, req.body)
      const [row] = await sql<{ id: number }[]>`
        insert into categories (name, icon, color, sort, builtin) values (${c.name}, ${c.icon}, ${c.color}, (select coalesce(max(sort), 0) + 1 from categories), false)
        returning id`
      return { id: row?.id }
    })
    priv.delete('/categories/:id', async (req) => {
      const { id } = parse(idParam, req.params)
      const [c] = await sql<{ builtin: boolean }[]>`select builtin from categories where id = ${id}`
      if (!c) throw new HttpError(404, 'No encontrado')
      if (c.builtin) throw new HttpError(409, 'No se pueden borrar categorías base')
      const [used] = await sql<{ n: number }[]>`select count(*)::int as n from maintenance_logs l join service_types t on t.id = l.service_type_id where t.category_id = ${id}`
      if (used && used.n > 0) throw new HttpError(409, 'La categoría tiene registros')
      await sql`delete from categories where id = ${id}`
      return { ok: true }
    })
    priv.post('/service-types', async (req) => {
      const t = parse(serviceTypeInput, req.body)
      const [cat] = await sql`select 1 from categories where id = ${t.categoryId}`
      if (!cat) throw new HttpError(400, 'Categoría inválida')
      const [row] = await sql<{ id: number }[]>`
        insert into service_types (category_id, name, interval_km, interval_days, note, builtin, sort)
        values (${t.categoryId}, ${t.name}, ${t.intervalKm}, ${t.intervalDays}, ${t.note}, false, 100) returning id`
      return { id: row?.id }
    })
    priv.patch('/service-types/:id', async (req) => {
      const { id } = parse(idParam, req.params)
      const p = parse(serviceTypePatch, req.body)
      const [cur] = await sql<ServiceType[]>`select id, name, interval_km, interval_days, note from service_types where id = ${id}`
      if (!cur) throw new HttpError(404, 'No encontrado')
      const next = {
        name: p.name ?? cur.name,
        intervalKm: p.intervalKm === undefined ? cur.intervalKm : p.intervalKm,
        intervalDays: p.intervalDays === undefined ? cur.intervalDays : p.intervalDays,
        note: p.note ?? cur.note,
      }
      await sql`update service_types set name = ${next.name}, interval_km = ${next.intervalKm}, interval_days = ${next.intervalDays}, note = ${next.note} where id = ${id}`
      return { ok: true }
    })
    priv.delete('/service-types/:id', async (req) => {
      const { id } = parse(idParam, req.params)
      const [t] = await sql<{ builtin: boolean }[]>`select builtin from service_types where id = ${id}`
      if (!t) throw new HttpError(404, 'No encontrado')
      if (t.builtin) throw new HttpError(409, 'No se pueden borrar servicios base')
      const [used] = await sql<{ n: number }[]>`select count(*)::int as n from maintenance_logs where service_type_id = ${id}`
      if (used && used.n > 0) throw new HttpError(409, 'El servicio tiene registros')
      await sql`delete from service_types where id = ${id}`
      return { ok: true }
    })

    // --- Mantenimiento ---
    const logSelect = sql`
      select l.id, l.service_type_id, t.name as service_name, c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color,
        l.detail, l.performed_on, l.odometer_km, l.cost_usd, l.fx_rate, l.shop, l.notes, l.next_km, l.next_date
      from maintenance_logs l join service_types t on t.id = l.service_type_id join categories c on c.id = t.category_id`

    priv.get('/maintenance', async (req) => {
      const q = parse(listQuery, req.query)
      const like = q.q ? `%${q.q.replace(/[\\%_]/g, '\\$&')}%` : null
      const where = sql`where true
        ${q.categoryId ? sql`and c.id = ${q.categoryId}` : sql``}
        ${q.serviceTypeId ? sql`and l.service_type_id = ${q.serviceTypeId}` : sql``}
        ${q.from ? sql`and l.performed_on >= ${q.from}` : sql``}
        ${q.to ? sql`and l.performed_on <= ${q.to}` : sql``}
        ${like ? sql`and (l.detail ilike ${like} or l.shop ilike ${like} or l.notes ilike ${like} or t.name ilike ${like} or c.name ilike ${like})` : sql``}`
      const items = await sql<MaintenanceLog[]>`${logSelect} ${where} order by l.performed_on desc, l.id desc limit ${q.limit} offset ${q.offset}`
      const [tot] = await sql<{ n: number }[]>`select count(*)::int as n from maintenance_logs l join service_types t on t.id = l.service_type_id join categories c on c.id = t.category_id ${where}`
      return { items, total: tot?.n ?? 0 }
    })

    const fxNow = async () => (await getFx(sql))?.rate ?? null

    priv.post('/maintenance', async (req) => {
      const m = parse(maintenanceInput, req.body)
      const [t] = await sql`select 1 from service_types where id = ${m.serviceTypeId}`
      if (!t) throw new HttpError(400, 'Servicio inválido')
      const rate = await fxNow()
      const [row] = await sql<{ id: number }[]>`
        insert into maintenance_logs (service_type_id, detail, performed_on, odometer_km, cost_usd, fx_rate, shop, notes, next_km, next_date)
        values (${m.serviceTypeId}, ${m.detail}, ${m.performedOn}, ${m.odometerKm}, ${m.costUsd}, ${rate}, ${m.shop}, ${m.notes}, ${m.nextKm}, ${m.nextDate})
        returning id`
      await bumpOdometer(m.odometerKm, m.performedOn)
      return { id: row?.id }
    })
    priv.put('/maintenance/:id', async (req) => {
      const { id } = parse(idParam, req.params)
      const m = parse(maintenanceInput, req.body)
      const [r] = await sql`
        update maintenance_logs set service_type_id = ${m.serviceTypeId}, detail = ${m.detail}, performed_on = ${m.performedOn}, odometer_km = ${m.odometerKm},
          cost_usd = ${m.costUsd}, shop = ${m.shop}, notes = ${m.notes}, next_km = ${m.nextKm}, next_date = ${m.nextDate}
        where id = ${id} returning id`
      if (!r) throw new HttpError(404, 'No encontrado')
      await bumpOdometer(m.odometerKm, m.performedOn)
      return { ok: true }
    })
    priv.delete('/maintenance/:id', async (req) => {
      const { id } = parse(idParam, req.params)
      const r = await sql`delete from maintenance_logs where id = ${id} returning id`
      if (!r.length) throw new HttpError(404, 'No encontrado')
      return { ok: true }
    })

    priv.get('/due', async (): Promise<{ items: DueItem[] }> => {
      const [veh, st] = await Promise.all([loadVehicle(), loadSettings()])
      const rows = await sql<Omit<DueItem, 'status' | 'kmLeft' | 'daysLeft'>[]>`
        select * from (
          select distinct on (l.service_type_id)
            t.id as service_type_id, t.name as service_name, c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color,
            l.performed_on as last_on, l.odometer_km as last_km, l.next_km, l.next_date
          from maintenance_logs l join service_types t on t.id = l.service_type_id join categories c on c.id = t.category_id
          order by l.service_type_id, l.performed_on desc, l.odometer_km desc, l.id desc
        ) x where next_km is not null or next_date is not null`
      const today = todayStr()
      const rank = { overdue: 0, soon: 1, ok: 2 }
      const items = rows
        .map((r) => ({ ...r, ...dueStatus({ nextKm: r.nextKm, nextDate: r.nextDate }, veh.odometerKm, today, st.warnKm, st.warnDays) }))
        .sort((a, b) => rank[a.status] - rank[b.status] || (a.kmLeft ?? 1e9) - (b.kmLeft ?? 1e9) || (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9))
      return { items }
    })

    // --- Gasolina ---
    const fuelRows = () => sql<FuelLog[]>`
      select id, filled_on, odometer_km, liters, price_per_liter_usd, total_usd, full_tank, notes from fuel_logs order by odometer_km desc, filled_on desc, id desc limit 1000`

    priv.get('/fuel', async () => {
      const rows = await fuelRows()
      const metrics = fuelMetrics(rows.map((r) => ({ id: r.id, filledOn: r.filledOn, odometerKm: r.odometerKm, liters: r.liters, totalUsd: r.totalUsd, fullTank: r.fullTank })))
      const notes = new Map(rows.map((r) => [r.id, r]))
      const items = metrics
        .map((m) => ({ ...m, pricePerLiterUsd: notes.get(m.id)?.pricePerLiterUsd ?? null, notes: notes.get(m.id)?.notes ?? '' }))
        .reverse()
      return { items, summary: fuelSummary(metrics) }
    })
    priv.post('/fuel', async (req) => {
      const f = parse(fuelInput, req.body)
      const ppl = f.pricePerLiterUsd ?? (f.liters > 0 ? Math.round((f.totalUsd / f.liters) * 10000) / 10000 : null)
      const [row] = await sql<{ id: number }[]>`
        insert into fuel_logs (filled_on, odometer_km, liters, price_per_liter_usd, total_usd, full_tank, notes)
        values (${f.filledOn}, ${f.odometerKm}, ${f.liters}, ${ppl}, ${f.totalUsd}, ${f.fullTank}, ${f.notes}) returning id`
      await bumpOdometer(f.odometerKm, f.filledOn)
      return { id: row?.id }
    })
    priv.put('/fuel/:id', async (req) => {
      const { id } = parse(idParam, req.params)
      const f = parse(fuelInput, req.body)
      const ppl = f.pricePerLiterUsd ?? Math.round((f.totalUsd / f.liters) * 10000) / 10000
      const [r] = await sql`
        update fuel_logs set filled_on = ${f.filledOn}, odometer_km = ${f.odometerKm}, liters = ${f.liters}, price_per_liter_usd = ${ppl},
          total_usd = ${f.totalUsd}, full_tank = ${f.fullTank}, notes = ${f.notes} where id = ${id} returning id`
      if (!r) throw new HttpError(404, 'No encontrado')
      await bumpOdometer(f.odometerKm, f.filledOn)
      return { ok: true }
    })
    priv.delete('/fuel/:id', async (req) => {
      const { id } = parse(idParam, req.params)
      const r = await sql`delete from fuel_logs where id = ${id} returning id`
      if (!r.length) throw new HttpError(404, 'No encontrado')
      return { ok: true }
    })

    // --- Estadísticas ---
    priv.get('/stats', async (): Promise<Stats> => {
      const byCategory = await sql<Stats['byCategory']>`
        select c.id as category_id, c.name, c.color, coalesce(sum(l.cost_usd), 0)::float as total_usd, count(l.id)::int as count
        from categories c join service_types t on t.category_id = c.id join maintenance_logs l on l.service_type_id = t.id
        group by c.id order by total_usd desc`
      const byMonth = await sql<Stats['byMonth']>`
        with m as (
          select to_char(performed_on, 'YYYY-MM') as month, coalesce(sum(cost_usd), 0) as maint, 0 as fuel from maintenance_logs group by 1
          union all
          select to_char(filled_on, 'YYYY-MM'), 0, sum(total_usd) from fuel_logs group by 1
        )
        select month, sum(maint)::float as maintenance_usd, sum(fuel)::float as fuel_usd from m group by month order by month desc limit 12`
      const [tot] = await sql<{ m: number; f: number; n: number }[]>`
        select (select coalesce(sum(cost_usd), 0) from maintenance_logs)::float as m, (select coalesce(sum(total_usd), 0) from fuel_logs)::float as f, (select count(*) from maintenance_logs)::int as n`
      return { byCategory, byMonth: byMonth.reverse(), totals: { maintenanceUsd: tot?.m ?? 0, fuelUsd: tot?.f ?? 0, logs: tot?.n ?? 0 } }
    })

    priv.get('/export', async (_req, reply) => {
      const [vehicle, categories, maintenance, fuel] = await Promise.all([
        loadVehicle(), loadCategories(),
        sql`${logSelect} order by l.performed_on desc, l.id desc`, fuelRows(),
      ])
      reply.header('content-disposition', `attachment; filename="carro-${todayStr()}.json"`)
      return { exportedAt: new Date().toISOString(), vehicle, categories, maintenance, fuel }
    })
  })

  return app
}
