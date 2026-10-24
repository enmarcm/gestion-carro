import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { maintenanceInput, suggestNext, type Category, type MaintenanceLog } from '@carro/shared'
import { ApiError, api } from '../lib/api'
import { fmtBs, numStr, toNum } from '../lib/format'
import { zodErrors, type Errors } from '../lib/form'
import { toast, useRefreshAll } from '../lib/data'
import { Button, DateInput, Field, NumInput, Select, Sheet, TextArea, TextInput } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  categories: Category[]
  today: string
  odometerKm: number
  fxRate: number | null
  /** Edición */
  log?: MaintenanceLog | null
  /** Preselección al crear */
  preset?: { categoryId?: number; typeId?: number }
}

export function MaintenanceForm({ open, onClose, categories, today, odometerKm, fxRate, log, preset }: Props) {
  const refresh = useRefreshAll()
  const [categoryId, setCategoryId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [detail, setDetail] = useState('')
  const [date, setDate] = useState(today)
  const [km, setKm] = useState('')
  const [cost, setCost] = useState('')
  const [shop, setShop] = useState('')
  const [notes, setNotes] = useState('')
  const [nextKm, setNextKm] = useState('')
  const [nextDate, setNextDate] = useState('')
  const [nextTouched, setNextTouched] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  // Reinicia el formulario cada vez que se abre.
  useEffect(() => {
    if (!open) return
    setErrors({}); setConfirmDel(false); setBusy(false)
    if (log) {
      setCategoryId(String(log.categoryId)); setTypeId(String(log.serviceTypeId)); setDetail(log.detail)
      setDate(log.performedOn); setKm(numStr(log.odometerKm)); setCost(numStr(log.costUsd)); setShop(log.shop)
      setNotes(log.notes); setNextKm(numStr(log.nextKm)); setNextDate(log.nextDate ?? ''); setNextTouched(true)
    } else {
      const t = preset?.typeId ? categories.flatMap((c) => c.types).find((x) => x.id === preset.typeId) : undefined
      const cid = t?.categoryId ?? preset?.categoryId ?? categories[0]?.id
      setCategoryId(cid ? String(cid) : ''); setTypeId(t ? String(t.id) : '')
      setDetail(''); setDate(today); setKm(numStr(odometerKm || null)); setCost(''); setShop(''); setNotes('')
      setNextKm(''); setNextDate(''); setNextTouched(false)
    }
  }, [open, log, preset, categories, today, odometerKm])

  const category = categories.find((c) => String(c.id) === categoryId)
  const type = category?.types.find((t) => String(t.id) === typeId)

  // Próximo cambio sugerido a partir del intervalo (hasta que el usuario lo edite).
  useEffect(() => {
    if (nextTouched || !type) return
    const k = toNum(km)
    const s = suggestNext(date || today, k !== null && !Number.isNaN(k) ? k : 0, type.intervalKm, type.intervalDays)
    setNextKm(k !== null && !Number.isNaN(k) ? numStr(s.nextKm) : '')
    setNextDate(date ? (s.nextDate ?? '') : '')
  }, [type, km, date, nextTouched, today])

  const costN = toNum(cost)
  const bs = useMemo(() => (costN && !Number.isNaN(costN) ? fmtBs(costN, fxRate) : ''), [costN, fxRate])

  async function submit() {
    const payload = {
      serviceTypeId: typeId ? Number(typeId) : 0,
      detail, performedOn: date, odometerKm: toNum(km) as number,
      costUsd: toNum(cost), shop, notes,
      nextKm: toNum(nextKm), nextDate: nextDate || null,
    }
    const parsed = maintenanceInput.safeParse(payload)
    if (!parsed.success) return setErrors(zodErrors(parsed.error))
    setErrors({}); setBusy(true)
    try {
      await api(log ? `/maintenance/${log.id}` : '/maintenance', { method: log ? 'PUT' : 'POST', body: parsed.data })
      await refresh()
      toast(log ? 'Registro actualizado' : 'Mantenimiento registrado')
      onClose()
    } catch (e) {
      if (e instanceof ApiError && e.issues.length) setErrors(e.fields)
      else toast(e instanceof Error ? e.message : 'Error', 'error')
    } finally { setBusy(false) }
  }

  async function remove() {
    if (!log) return
    if (!confirmDel) return setConfirmDel(true)
    setBusy(true)
    try {
      await api(`/maintenance/${log.id}`, { method: 'DELETE' })
      await refresh(); toast('Registro eliminado'); onClose()
    } catch (e) { toast(e instanceof Error ? e.message : 'Error', 'error') } finally { setBusy(false) }
  }

  return (
    <Sheet
      open={open} onClose={onClose} title={log ? 'Editar mantenimiento' : 'Registrar mantenimiento'}
      footer={
        <div className="flex gap-3">
          {log && <Button variant="danger" onClick={remove} loading={busy && confirmDel} aria-label="Eliminar"><Trash2 size={18} />{confirmDel ? '¿Seguro?' : ''}</Button>}
          <Button className="flex-1" onClick={submit} loading={busy && !confirmDel}>{log ? 'Guardar cambios' : 'Guardar'}</Button>
        </div>
      }
    >
      <div className="grid gap-4 pb-2">
        <Field label="Categoría">
          {(id) => (
            <Select id={id} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setTypeId('') ; setNextTouched(false) }}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Servicio" error={errors.serviceTypeId} hint={type?.note || undefined}>
          {(id, inv) => (
            <Select id={id} invalid={inv} value={typeId} onChange={(e) => { setTypeId(e.target.value); setNextTouched(false) }}>
              <option value="">Elige un servicio…</option>
              {category?.types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Detalle (opcional)" error={errors.detail} hint="Ej: marca, referencia, medida de la pieza">
          {(id, inv) => <TextInput id={id} invalid={inv} value={detail} maxLength={120} onChange={(e) => setDetail(e.target.value)} placeholder="Pieza o detalle" />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha" error={errors.performedOn}>{(id, inv) => <DateInput id={id} invalid={inv} value={date} max="2100-01-01" onChange={(e) => setDate(e.target.value)} />}</Field>
          <Field label="Kilometraje" error={errors.odometerKm}>{(id, inv) => <NumInput id={id} invalid={inv} value={km} onChange={(e) => setKm(e.target.value)} placeholder="km" inputMode="numeric" />}</Field>
        </div>
        <Field label="Costo (USD)" error={errors.costUsd} hint={bs ? `≈ ${bs} (BCV)` : 'Opcional'}>
          {(id, inv) => <NumInput id={id} invalid={inv} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />}
        </Field>
        <Field label="Taller / lugar (opcional)" error={errors.shop}>
          {(id, inv) => <TextInput id={id} invalid={inv} value={shop} maxLength={80} onChange={(e) => setShop(e.target.value)} />}
        </Field>
        <div className="neu-flat grid gap-3 p-4">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]">Próximo cambio</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="A los (km)" error={errors.nextKm}>{(id, inv) => <NumInput id={id} invalid={inv} inputMode="numeric" value={nextKm} onChange={(e) => { setNextKm(e.target.value); setNextTouched(true) }} placeholder="—" />}</Field>
            <Field label="O en fecha" error={errors.nextDate}>{(id, inv) => <DateInput id={id} invalid={inv} value={nextDate} onChange={(e) => { setNextDate(e.target.value); setNextTouched(true) }} />}</Field>
          </div>
          {type && (type.intervalKm || type.intervalDays) && (
            <p className="text-[12px] text-[var(--muted)]">Intervalo base: {[type.intervalKm && `${type.intervalKm.toLocaleString('es-VE')} km`, type.intervalDays && `${type.intervalDays} días`].filter(Boolean).join(' o ')}</p>
          )}
        </div>
        <Field label="Notas (opcional)" error={errors.notes}>
          {(id, inv) => <TextArea id={id} invalid={inv} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
      </div>
    </Sheet>
  )
}
