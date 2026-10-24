import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { loginSchema } from '@carro/shared'
import { api, ApiError } from '../lib/api'
import { Button, Field, TextInput } from '../components/ui'
import { CarLottie } from '../components/Splash'

export function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const p = loginSchema.safeParse({ password: pw })
    if (!p.success) return setErr(p.error.issues[0]?.message ?? 'Inválido')
    setErr(''); setBusy(true)
    try {
      await api('/auth/login', { method: 'POST', body: p.data })
      onDone()
    } catch (e2) {
      setErr(e2 instanceof ApiError && e2.status === 429 ? 'Demasiados intentos. Espera unos minutos.' : e2 instanceof Error ? e2.message : 'Error')
    } finally { setBusy(false) }
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center px-5 py-8">
      <div className="rise grid w-full max-w-[400px] gap-6">
        <div className="neu overflow-hidden p-2" style={{ borderRadius: 32 }}>
          <CarLottie className="w-full" />
        </div>
        <div className="text-center">
          <h1 className="title-wide text-[15px]">Mi Corsa</h1>
          <p className="mt-2 text-[13px] text-[var(--muted)]">Chevrolet Corsa 2001 · Verde</p>
        </div>
        <form onSubmit={submit} className="neu grid gap-4 p-5" noValidate>
          <Field label="Clave de acceso" error={err}>
            {(id, inv) => (
              <div className="relative">
                <TextInput id={id} invalid={inv} type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className="pr-12" placeholder="••••••" maxLength={128} />
                <button type="button" aria-label={show ? 'Ocultar clave' : 'Mostrar clave'} onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-[var(--muted)]">
                  {show ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            )}
          </Field>
          <Button type="submit" loading={busy}><Lock size={18} />Entrar</Button>
        </form>
      </div>
    </main>
  )
}
