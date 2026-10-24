import type { ZodError } from 'zod'

export type Errors = Record<string, string>

/** Primer mensaje por campo a partir de un ZodError. */
export function zodErrors(err: ZodError): Errors {
  const out: Errors = {}
  for (const i of err.issues) {
    const k = String(i.path[0] ?? '_')
    if (!(k in out)) out[k] = i.message
  }
  return out
}
