import type { Fx } from '@carro/shared'
import { config } from './config.js'
import type { Sql } from './db.js'

const TTL_MS = 6 * 3600 * 1000

/** Tasa BCV (promedio oficial) cacheada en DB; si la API cae devuelve la última conocida. */
export async function getFx(sql: Sql, now = Date.now()): Promise<Fx | null> {
  const [row] = await sql<{ rate: number; sourceDate: Date; fetchedAt: Date }[]>`select rate, source_date, fetched_at from fx_cache where id = 1`
  if (row && now - row.fetchedAt.getTime() < TTL_MS) {
    return { rate: row.rate, sourceDate: row.sourceDate.toISOString(), stale: false }
  }
  try {
    const res = await fetch(config.fxUrl, { signal: AbortSignal.timeout(5000), headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(`fx ${res.status}`)
    const j = (await res.json()) as { promedio?: unknown; fechaActualizacion?: unknown }
    const rate = Number(j.promedio)
    const when = new Date(String(j.fechaActualizacion))
    if (!Number.isFinite(rate) || rate <= 0 || rate > 1e7 || Number.isNaN(when.getTime())) throw new Error('fx inválido')
    await sql`
      insert into fx_cache (id, rate, source_date, fetched_at) values (1, ${rate}, ${when.toISOString()}, now())
      on conflict (id) do update set rate = excluded.rate, source_date = excluded.source_date, fetched_at = now()`
    return { rate, sourceDate: when.toISOString(), stale: false }
  } catch {
    return row ? { rate: row.rate, sourceDate: row.sourceDate.toISOString(), stale: true } : null
  }
}
