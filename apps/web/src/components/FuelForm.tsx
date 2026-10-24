import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { fuelInput } from '@carro/shared'
import { ApiError, api } from '../lib/api'
import { fmtBs, fmtUsd, numStr, toNum } from '../lib/format'
import { zodErrors, type Errors } from '../lib/form'
import { toast, useRefreshAll, type FuelItem } from '../lib/data'
import { Button, DateInput, Field, NumInput, Sheet, TextArea, Toggle } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  today: string
  odometerKm: number
  fxRate: number | null
  fill?: FuelItem | null
}

export function FuelForm({ open, onClose, today, odometerKm, fxRate, fill }: Props) {
  const refresh = useRefreshAll()
  const [date, setDate] = useState(today)
  const [km, setKm] = useState('')
  const [liters, setLiters] = useState('')
  const [price, setPrice] = useState('')
  const [total, setTotal] = useState('')
  const [full, setFull] = useState(true)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({}); setBusy(false); setConfirmDel(false)
    if (fill) {
      setDate(fill.filledOn); setKm(numStr(fill.odometerKm)); setLiters(numStr(fill.liters)); setPrice(numStr(fill.pricePerLiterUsd))
      setTotal(numStr(fill.totalUsd)); setFull(fill.fullTank); setNotes(fill.notes)
    } else {
      setDate(today); setKm(numStr(odometerKm || null)); setLiters(''); setPrice(''); setTotal(''); setFull(true); setNotes('')
    }
  }, [open, fill, today, odometerKm])

  const l = toNum(liters), p = toNum(price), t = toNum(total)
  const valid = (n: number | null): n is number => n !== null && !Number.isNaN(n)
  const derivedTotal = valid(l) && valid(p) && !valid(t) ? Math.round(l * p * 100) / 100 : null
  const derivedPrice = valid(l) && l > 0 && valid(t) && !valid(p) ? t / l : null
  const shownTotal = valid(t) ? t : derivedTotal

  async function submit() {
    const totalUsd = valid(t) ? t : derivedTotal
    const payload = {
      filledOn: date, odometerKm: toNum(km) as number, liters: l as number,
      pricePerLiterUsd: valid(p) ? p : derivedPrice !== null ? Math.round(derivedPrice * 10000) / 10000 : null,
      totalUsd: totalUsd as number, fullTank: full, notes,
    }
    const parsed = fuelInput.safeParse(payload)
    if (!parsed.success) {
      const e = zodErrors(parsed.error)
      if (e.totalUsd) e.totalUsd = 'Indica el total o el precio por litro'
      return setErrors(e)
    }
    setErrors({}); setBusy(true)
    try {
      await api(fill ? `/fuel/${fill.id}` : '/fuel', { method: fill ? 'PUT' : 'POST', body: parsed.data })
      await refresh(); toast(fill ? 'Carga actualizada' : 'Gasolina registrada'); onClose()
    } catch (e) {
      if (e instanceof ApiError && e.issues.length) setErrors(e.fields)
      else toast(e instanceof Error ? e.message : 'Error', 'error')
    } finally { setBusy(false) }
  }

  async function remove() {
    if (!fill) return
    if (!confirmDel) return setConfirmDel(true)
    setBusy(true)
    try { await api(`/fuel/${fill.id}`, { method: 'DELETE' }); await refresh(); toast('Carga eliminada'); onClose() }
    catch (e) { toast(e instanceof Error ? e.message : 'Error', 'error') } finally { setBusy(false) }
  }

  return (
    <Sheet
      open={open} onClose={onClose} title={fill ? 'Editar carga' : 'Cargar gasolina'}
      footer={
        <div className="flex gap-3">
          {fill && <Button variant="danger" onClick={remove} loading={busy && confirmDel} aria-label="Eliminar"><Trash2 size={18} />{confirmDel ? '¿Seguro?' : ''}</Button>}
          <Button className="flex-1" onClick={submit} loading={busy && !confirmDel}>{fill ? 'Guardar cambios' : 'Guardar'}</Button>
        </div>
      }
    >
      <div className="grid gap-4 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha" error={errors.filledOn}>{(id, inv) => <DateInput id={id} invalid={inv} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
          <Field label="Kilometraje" error={errors.odometerKm}>{(id, inv) => <NumInput id={id} invalid={inv} inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} placeholder="km" />}</Field>
        </div>
        <Field label="Litros" error={errors.liters}>{(id, inv) => <NumInput id={id} invalid={inv} value={liters} onChange={(e) => setLiters(e.target.value)} placeholder="0.0" />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio / litro (USD)" error={errors.pricePerLiterUsd} hint={derivedPrice !== null ? `≈ ${fmtUsd(derivedPrice)}` : undefined}>
            {(id, inv) => <NumInput id={id} invalid={inv} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />}
          </Field>
          <Field label="Total (USD)" error={errors.totalUsd} hint={derivedTotal !== null ? `≈ ${fmtUsd(derivedTotal)}` : undefined}>
            {(id, inv) => <NumInput id={id} invalid={inv} value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" />}
          </Field>
        </div>
        {shownTotal !== null && fxRate && <p className="-mt-2 px-1 text-[12px] text-[var(--muted)]">≈ {fmtBs(shownTotal, fxRate)} al cambio BCV</p>}
        <div className="neu-flat flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-[15px] font-bold">Tanque lleno</p>
            <p className="text-[12px] text-[var(--muted)]">Necesario para calcular km/L con precisión</p>
          </div>
          <Toggle checked={full} onChange={setFull} label="Tanque lleno" />
        </div>
        <Field label="Notas (opcional)" error={errors.notes}>{(id, inv) => <TextArea id={id} invalid={inv} value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} />}</Field>
      </div>
    </Sheet>
  )
}
