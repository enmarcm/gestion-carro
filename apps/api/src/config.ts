const required = (name: string): string => {
  const v = process.env[name]
  if (!v) throw new Error(`Falta variable de entorno: ${name}`)
  return v
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: () => required('DATABASE_URL'),
  sessionSecret: () => {
    const s = required('SESSION_SECRET')
    if (s.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres')
    return s
  },
  initialPassword: process.env.INITIAL_PASSWORD ?? '',
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
  secureCookie: process.env.NODE_ENV === 'production',
  sessionDays: 30,
  fxUrl: 'https://ve.dolarapi.com/v1/dolares/oficial',
}
