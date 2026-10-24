import { useState } from 'react'
import { ChevronDown, Download, KeyRound, LogOut, Save } from 'lucide-react'
import { changePasswordSchema, settingsPatch, vehicleSchema, type Category } from '@carro/shared'
import { ApiError, api, apiUrl } from '../lib/api'
import { useApp } from '../lib/ctx'
import { toast, useRefreshAll } from '../lib/data'
import { zodErrors, type Errors } from '../lib/form'
import { numStr, toNum } from '../lib/format'
import { Button, Field, NumInput, Sheet, TextInput } from '../components/ui'
import { CatIcon } from '../lib/icons'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="neu-flat grid gap-4 p-4">
      <h3 className="text-[13px] font-bold uppercase tracking-widest text-[var(--muted)]">{title}</h3>
      {children}
    </section>
  )
}

function VehicleForm() {
  const { boot } = useApp()
  const refresh = useRefreshAll()
  const v = boot.vehicle
  const [f, setF] = useState({ brand: v.brand, model: v.model, year: String(v.year), color: v.color, plate: v.plate, km: numStr(v.odometerKm) })
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  async function save() {
    const p = vehicleSchema.safeParse({ brand: f.brand, model: f.model, year: toNum(f.year), color: f.color, plate: f.plate, odometerKm: toNum(f.km) })
    if (!p.success) return setErrors(zodErrors(p.error))
    setErrors({}); setBusy(true)
    try { await api('/vehicle', { method: 'PUT', body: p.data }); await refresh(); toast('Vehículo guardado') }
    catch (e) { toast(e instanceof Error ? e.message : 'Error', 'error') } finally { setBusy(false) }
  }
  return (
    <Section title="Vehículo">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Marca" error={errors.brand}>{(id, inv) => <TextInput id={id} invalid={inv} value={f.brand} onChange={set('brand')} maxLength={40} />}</Field>
        <Field label="Modelo" error={errors.model}>{(id, inv) => <TextInput id={id} invalid={inv} value={f.model} onChange={set('model')} maxLength={40} />}</Field>
        <Field label="Año" error={errors.year}>{(id, inv) => <NumInput id={id} invalid={inv} inputMode="numeric" value={f.year} onChange={set('year')} />}</Field>
        <Field label="Color" error={errors.color}>{(id, inv) => <TextInput id={id} invalid={inv} value={f.color} onChange={set('color')} maxLength={30} />}</Field>
        <Field label="Placa" error={errors.plate}>{(id, inv) => <TextInput id={id} invalid={inv} value={f.plate} onChange={set('plate')} maxLength={15} autoCapitalize="characters" />}</Field>
        <Field label="Kilometraje" error={errors.odometerKm}>{(id, inv) => <NumInput id={id} invalid={inv} inputMode="numeric" value={f.km} onChange={set('km')} />}</Field>
      </div>
      <Button onClick={save} loading={busy}><Save size={18} />Guardar vehículo</Button>
    </Section>
  )
}

function IntervalRow({ t }: { t: Category['types'][number] }) {
  const refresh = useRefreshAll()
  const [km, setKm] = useState(numStr(t.intervalKm))
  const [days, setDays] = useState(numStr(t.intervalDays))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const dirty = km !== numStr(t.intervalKm) || days !== numStr(t.intervalDays)
  async function save() {
    const kmN = toNum(km), dN = toNum(days)
    if ((kmN !== null && (Number.isNaN(kmN) || kmN < 0 || !Number.isInteger(kmN))) || (dN !== null && (Number.isNaN(dN) || dN < 1 || !Number.isInteger(dN)))) return setErr('Valores inválidos')
    setErr(''); setBusy(true)
    try { await api(`/service-types/${t.id}`, { method: 'PATCH', body: { intervalKm: kmN === 0 ? null : kmN, intervalDays: dN } }); await refresh(); toast('Intervalo guardado') }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Error') } finally { setBusy(false) }
  }
  return (
    <div className="grid gap-2 py-3">
      <p className="text-[14px] font-bold leading-snug">{t.name}</p>
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <Field label="Km">{(id) => <NumInput id={id} inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} placeholder="—" className="!h-11" />}</Field>
        <Field label="Días">{(id) => <NumInput id={id} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} placeholder="—" className="!h-11" />}</Field>
        <Button className="!h-11 !px-4" onClick={save} loading={busy} disabled={!dirty} aria-label={`Guardar ${t.name}`}><Save size={16} /></Button>
      </div>
      {err && <p role="alert" className="px-1 text-[12px] font-semibold text-[var(--bad)]">{err}</p>}
    </div>
  )
}

function Intervals() {
  const { boot } = useApp()
  const [open, setOpen] = useState<number | null>(null)
  return (
    <Section title="Intervalos de cambio">
      <p className="-mt-2 text-[12px] text-[var(--muted)]">Se usan para sugerir el próximo cambio. Km vacío = sin intervalo por km.</p>
      <div className="grid gap-2">
        {boot.categories.map((c) => (
          <div key={c.id} className="neu-sm overflow-hidden">
            <button onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id} className="flex w-full items-center gap-3 p-3.5 text-left">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: c.color }}><CatIcon name={c.icon} size={18} /></span>
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold">{c.name}</span>
              <ChevronDown size={18} className={`shrink-0 text-[var(--muted)] transition ${open === c.id ? 'rotate-180' : ''}`} />
            </button>
            {open === c.id && <div className="divide-y divide-[#cfdeee]/70 px-3.5 pb-1">{c.types.map((t) => <IntervalRow key={t.id} t={t} />)}</div>}
          </div>
        ))}
      </div>
    </Section>
  )
}

function Alerts() {
  const { boot } = useApp()
  const refresh = useRefreshAll()
  const [km, setKm] = useState(String(boot.settings.warnKm))
  const [days, setDays] = useState(String(boot.settings.warnDays))
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  async function save() {
    const p = settingsPatch.safeParse({ warnKm: toNum(km), warnDays: toNum(days) })
    if (!p.success || p.data.warnKm === undefined || p.data.warnDays === undefined) return setErrors(p.success ? { warnKm: 'Requerido' } : zodErrors(p.error))
    setErrors({}); setBusy(true)
    try { await api('/settings', { method: 'PATCH', body: p.data }); await refresh(); toast('Avisos guardados') }
    catch (e) { toast(e instanceof Error ? e.message : 'Error', 'error') } finally { setBusy(false) }
  }
  return (
    <Section title="Avisos">
      <p className="-mt-2 text-[12px] text-[var(--muted)]">Marcar “Pronto” cuando falten menos de…</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kilómetros" error={errors.warnKm}>{(id, inv) => <NumInput id={id} invalid={inv} inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} />}</Field>
        <Field label="Días" error={errors.warnDays}>{(id, inv) => <NumInput id={id} invalid={inv} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />}</Field>
      </div>
      <Button variant="soft" onClick={save} loading={busy}>Guardar avisos</Button>
    </Section>
  )
}

function Password() {
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  async function save() {
    const p = changePasswordSchema.safeParse({ current: cur, next })
    if (!p.success) return setErrors(zodErrors(p.error))
    setErrors({}); setBusy(true)
    try { await api('/auth/password', { method: 'POST', body: p.data }); setCur(''); setNext(''); toast('Clave actualizada') }
    catch (e) { setErrors({ current: e instanceof Error ? e.message : 'Error' }) } finally { setBusy(false) }
  }
  return (
    <Section title="Seguridad">
      <Field label="Clave actual" error={errors.current}>{(id, inv) => <TextInput id={id} invalid={inv} type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />}</Field>
      <Field label="Nueva clave" error={errors.next} hint="Mínimo 6 caracteres">{(id, inv) => <TextInput id={id} invalid={inv} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}</Field>
      <Button variant="soft" onClick={save} loading={busy}><KeyRound size={18} />Cambiar clave</Button>
    </Section>
  )
}

export function SettingsSheet({ open, onClose, onLogout }: { open: boolean; onClose: () => void; onLogout: () => void }) {
  async function exportData() {
    try {
      const r = await fetch(apiUrl('/export'), { credentials: 'include' })
      if (!r.ok) throw new Error('No se pudo exportar')
      const url = URL.createObjectURL(await r.blob())
      const a = document.createElement('a')
      a.href = url; a.download = `mi-corsa-${new Date().toISOString().slice(0, 10)}.json`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { toast(e instanceof Error ? e.message : 'Error', 'error') }
  }
  return (
    <Sheet open={open} onClose={onClose} title="Ajustes">
      <div className="grid gap-4 pb-6">
        <VehicleForm />
        <Alerts />
        <Intervals />
        <Section title="Datos">
          <Button variant="soft" onClick={exportData}><Download size={18} />Exportar respaldo (JSON)</Button>
        </Section>
        <Password />
        <Button variant="danger" onClick={onLogout}><LogOut size={18} />Cerrar sesión</Button>
      </div>
    </Sheet>
  )
}
