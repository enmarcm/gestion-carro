import { useMemo, useState } from 'react'
import { ChevronRight, Plus, Search, X } from 'lucide-react'
import { categoryInput, serviceTypeInput, type Category } from '@carro/shared'
import { ApiError, api } from '../lib/api'
import { useApp } from '../lib/ctx'
import { toast, useRefreshAll } from '../lib/data'
import { zodErrors, type Errors } from '../lib/form'
import { CatIcon, ICON_CHOICES } from '../lib/icons'
import { toNum } from '../lib/format'
import { Button, Card, Empty, Field, NumInput, ScreenHeader, Sheet, TextInput } from '../components/ui'

const COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6', '#64748b']

function intervalText(t: { intervalKm: number | null; intervalDays: number | null }) {
  const p = [t.intervalKm && `${t.intervalKm.toLocaleString('es-VE')} km`, t.intervalDays && (t.intervalDays % 365 === 0 ? `${t.intervalDays / 365} año${t.intervalDays > 365 ? 's' : ''}` : `${t.intervalDays} días`)].filter(Boolean)
  return p.length ? `Cada ${p.join(' o ')}` : 'Sin intervalo'
}

function CategorySheet({ cat, onClose }: { cat: Category; onClose: () => void }) {
  const { addMaintenance } = useApp()
  const refresh = useRefreshAll()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [km, setKm] = useState('')
  const [days, setDays] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)

  async function create() {
    const parsed = serviceTypeInput.safeParse({ categoryId: cat.id, name, intervalKm: toNum(km), intervalDays: toNum(days), note: '' })
    if (!parsed.success) return setErrors(zodErrors(parsed.error))
    setBusy(true)
    try {
      await api('/service-types', { method: 'POST', body: parsed.data })
      await refresh(); toast('Servicio añadido'); setAdding(false); setName(''); setKm(''); setDays(''); setErrors({})
    } catch (e) { setErrors(e instanceof ApiError ? e.fields : {}); toast(e instanceof Error ? e.message : 'Error', 'error') } finally { setBusy(false) }
  }

  return (
    <Sheet open onClose={onClose} title={cat.name}>
      <div className="grid gap-3 pb-3">
        {cat.types.map((t) => (
          <button key={t.id} onClick={() => { onClose(); addMaintenance({ typeId: t.id }) }} className="press neu-sm flex w-full items-center gap-3 p-4 text-left">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold leading-snug">{t.name}</span>
              <span className="block text-[12px] text-[var(--muted)]">{intervalText(t)}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-[var(--muted)]" />
          </button>
        ))}
        {adding ? (
          <div className="neu-flat grid gap-3 p-4">
            <Field label="Nombre del servicio" error={errors.name}>{(id, inv) => <TextInput id={id} invalid={inv} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Ej: Cambio de empacadura" />}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cada (km)" error={errors.intervalKm}>{(id, inv) => <NumInput id={id} invalid={inv} inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} placeholder="opcional" />}</Field>
              <Field label="Cada (días)" error={errors.intervalDays}>{(id, inv) => <NumInput id={id} invalid={inv} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} placeholder="opcional" />}</Field>
            </div>
            <div className="flex gap-3">
              <Button variant="soft" onClick={() => { setAdding(false); setErrors({}) }}>Cancelar</Button>
              <Button className="flex-1" onClick={create} loading={busy}>Añadir</Button>
            </div>
          </div>
        ) : (
          <Button variant="soft" onClick={() => setAdding(true)}><Plus size={18} />Añadir servicio propio</Button>
        )}
      </div>
    </Sheet>
  )
}

function NewCategorySheet({ onClose }: { onClose: () => void }) {
  const refresh = useRefreshAll()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('Wrench')
  const [color, setColor] = useState(COLORS[0]!)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  async function save() {
    const p = categoryInput.safeParse({ name, icon, color })
    if (!p.success) return setErrors(zodErrors(p.error))
    setBusy(true)
    try { await api('/categories', { method: 'POST', body: p.data }); await refresh(); toast('Categoría creada'); onClose() }
    catch (e) { toast(e instanceof Error ? e.message : 'Error', 'error') } finally { setBusy(false) }
  }
  return (
    <Sheet open onClose={onClose} title="Nueva categoría" footer={<Button className="w-full" onClick={save} loading={busy}>Crear</Button>}>
      <div className="grid gap-4 pb-2">
        <Field label="Nombre" error={errors.name}>{(id, inv) => <TextInput id={id} invalid={inv} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Ej: Carrocería" />}</Field>
        <div>
          <p className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]">Icono</p>
          <div className="flex flex-wrap gap-3">
            {ICON_CHOICES.map((i) => (
              <button key={i} type="button" aria-label={i} aria-pressed={icon === i} onClick={() => setIcon(i)} className={`press grid h-12 w-12 place-items-center ${icon === i ? 'neu-in text-[var(--green)]' : 'neu-sm'}`}><CatIcon name={i} /></button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]">Color</p>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <button key={c} type="button" aria-label={c} aria-pressed={color === c} onClick={() => setColor(c)} className="press h-10 w-10 rounded-full" style={{ background: c, borderRadius: 999, outline: color === c ? '3px solid #2a4660' : 'none', outlineOffset: 2 }} />
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}

export function Services() {
  const { boot, addMaintenance } = useApp()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Category | null>(null)
  const [newCat, setNewCat] = useState(false)

  const query = q.trim().toLowerCase()
  const matches = useMemo(
    () => (query ? boot.categories.flatMap((c) => c.types.filter((t) => `${t.name} ${c.name}`.toLowerCase().includes(query)).map((t) => ({ t, c }))) : []),
    [query, boot.categories],
  )
  // Mantiene el sheet sincronizado si cambian los datos.
  const openCat = open ? (boot.categories.find((c) => c.id === open.id) ?? open) : null

  return (
    <div className="grid gap-5">
      <ScreenHeader title="Servicios" />
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input className="field pl-11 pr-11" placeholder="Buscar servicio o categoría…" aria-label="Buscar servicio" value={q} onChange={(e) => setQ(e.target.value)} maxLength={60} />
        {q && <button aria-label="Limpiar" onClick={() => setQ('')} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-[var(--muted)]"><X size={18} /></button>}
      </div>

      {query ? (
        matches.length === 0 ? (
          <Card><Empty icon={<Search size={26} />} title="Sin resultados" text="Prueba otra palabra o crea un servicio propio dentro de una categoría." /></Card>
        ) : (
          <div className="grid gap-3">
            {matches.map(({ t, c }) => (
              <button key={t.id} onClick={() => addMaintenance({ typeId: t.id })} className="press neu-sm flex w-full items-center gap-3 p-3.5 text-left">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: c.color }}><CatIcon name={c.icon} size={20} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold">{t.name}</span>
                  <span className="block truncate text-[12px] text-[var(--muted)]">{c.name} · {intervalText(t)}</span>
                </span>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {boot.categories.map((c, i) => (
            <button key={c.id} onClick={() => setOpen(c)} className="press neu rise grid min-w-0 content-between gap-4 p-4 text-left" style={{ minHeight: 132, animationDelay: `${Math.min(i, 10) * 35}ms` }}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)`, boxShadow: `0 8px 16px ${c.color}44` }}><CatIcon name={c.icon} /></span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold leading-tight">{c.name}</span>
                <span className="block text-[12px] text-[var(--muted)]">{c.types.length} servicio{c.types.length === 1 ? '' : 's'}</span>
              </span>
            </button>
          ))}
          <button onClick={() => setNewCat(true)} className="press neu-in grid min-h-[132px] place-items-center p-4 text-[var(--muted)]" style={{ borderRadius: 24 }}>
            <span className="grid place-items-center gap-2 text-center"><Plus size={26} /><span className="text-[13px] font-bold">Nueva categoría</span></span>
          </button>
        </div>
      )}

      {openCat && <CategorySheet cat={openCat} onClose={() => setOpen(null)} />}
      {newCat && <NewCategorySheet onClose={() => setNewCat(false)} />}
    </div>
  )
}
