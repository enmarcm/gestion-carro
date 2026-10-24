const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://apicarro.enmarcm.site'

export class ApiError extends Error {
  constructor(public status: number, message: string, public issues: { path: string; message: string }[] = []) {
    super(message)
  }
  /** Errores de validación del servidor por campo. */
  get fields(): Record<string, string> {
    return Object.fromEntries(this.issues.map((i) => [i.path, i.message]))
  }
}

export const UNAUTH_EVENT = 'carro:unauth'

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? 'GET'
  let res: Response
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: 'include',
      headers: {
        ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(method !== 'GET' ? { 'x-requested-with': 'carro' } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Sin conexión con el servidor')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login' && path !== '/auth/password') window.dispatchEvent(new Event(UNAUTH_EVENT))
    throw new ApiError(res.status, (data as { error?: string }).error ?? 'Error', (data as { issues?: [] }).issues ?? [])
  }
  return data as T
}

export const apiUrl = (p: string) => BASE + p
