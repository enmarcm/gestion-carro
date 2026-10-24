import { buildApp } from './app.js'
import { config } from './config.js'
import { getSql, migrate } from './db.js'
import { getAuthState, setPassword } from './auth.js'

const sql = getSql()
await migrate(sql)

// Primera ejecución: la clave inicial viene de INITIAL_PASSWORD (se puede quitar del entorno después).
const st = await getAuthState(sql)
if (!st.hash) {
  if (config.initialPassword.length < 6) throw new Error('Define INITIAL_PASSWORD (mín. 6 caracteres) para la primera ejecución')
  await setPassword(sql, config.initialPassword, false)
}

const app = await buildApp({
  sql,
  secret: config.sessionSecret(),
  origin: config.allowedOrigin,
  secureCookie: config.secureCookie,
})

const shutdown = async () => {
  await app.close()
  await sql.end({ timeout: 5 })
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

await app.listen({ port: config.port, host: config.host })
