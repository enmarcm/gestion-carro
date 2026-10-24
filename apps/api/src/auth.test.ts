import { describe, expect, it } from 'vitest'
import { signToken, verifyToken } from './auth'
import { buildApp } from './app'
import { makeSql } from './db'

const secret = 'x'.repeat(40)

describe('token', () => {
  it('válido', () => expect(verifyToken(secret, signToken(secret, 1, 60), 1)).toBe(true))
  it('expirado', () => expect(verifyToken(secret, signToken(secret, 1, 60, 0), 1, 120_000)).toBe(false))
  it('versión distinta', () => expect(verifyToken(secret, signToken(secret, 1, 60), 2)).toBe(false))
  it('firma alterada', () => expect(verifyToken(secret, signToken(secret, 1, 60).replace(/.$/, 'A'), 1)).toBe(false))
  it('otro secreto', () => expect(verifyToken('y'.repeat(40), signToken(secret, 1, 60), 1)).toBe(false))
  it('vacío', () => expect(verifyToken(secret, undefined, 1)).toBe(false))
})

describe('rutas sin sesión', () => {
  const sql = makeSql('postgres://nobody:none@127.0.0.1:1/none')
  it('/health público', async () => {
    const app = await buildApp({ sql, secret, origin: 'https://x.test', secureCookie: false })
    expect((await app.inject('/health')).statusCode).toBe(200)
    await app.close()
  })
  it('rutas privadas y desconocidas no filtran datos', async () => {
    const app = await buildApp({ sql, secret, origin: 'https://x.test', secureCookie: false })
    expect((await app.inject('/nope')).statusCode).toBe(404)
    await app.close()
  })
})
