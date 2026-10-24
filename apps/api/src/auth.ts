import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { hash, verify } from '@node-rs/argon2'
import type { Sql } from './db.js'

export const COOKIE = 'carro_session'

const b64 = (b: Buffer) => b.toString('base64url')

/** Token sin estado: `exp.ver.firma`. `ver` invalida sesiones al cambiar la clave. */
export function signToken(secret: string, ver: number, ttlSeconds: number, now = Date.now()): string {
  const body = `${Math.floor(now / 1000) + ttlSeconds}.${ver}`
  return `${body}.${b64(createHmac('sha256', secret).update(body).digest())}`
}

export function verifyToken(secret: string, token: string | undefined, ver: number, now = Date.now()): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [exp, v, sig] = parts as [string, string, string]
  const expected = createHmac('sha256', secret).update(`${exp}.${v}`).digest()
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false
  if (Number(v) !== ver) return false
  return Number(exp) > Math.floor(now / 1000)
}

export async function hashPassword(pw: string) {
  return hash(pw)
}

// Hash descartable para igualar tiempos cuando aún no hay clave configurada.
let dummy: Promise<string> | undefined
export async function verifyPassword(stored: string | null, pw: string): Promise<boolean> {
  if (!stored) {
    dummy ??= hash(randomBytes(8).toString('hex'))
    await verify(await dummy, pw).catch(() => false)
    return false
  }
  return verify(stored, pw).catch(() => false)
}

export async function getAuthState(sql: Sql): Promise<{ hash: string | null; ver: number }> {
  const rows = await sql<{ key: string; value: unknown }[]>`select key, value from settings where key in ('password_hash', 'token_ver')`
  const m = new Map(rows.map((r) => [r.key, r.value]))
  return { hash: (m.get('password_hash') as string | undefined) ?? null, ver: (m.get('token_ver') as number | undefined) ?? 1 }
}

export async function setPassword(sql: Sql, pw: string, bumpVersion: boolean) {
  const h = await hashPassword(pw)
  await sql`insert into settings (key, value) values ('password_hash', ${sql.json(h)}) on conflict (key) do update set value = excluded.value`
  if (bumpVersion) {
    await sql`insert into settings (key, value) values ('token_ver', ${sql.json(2)}) on conflict (key) do update set value = to_jsonb((settings.value)::int + 1)`
  }
}
