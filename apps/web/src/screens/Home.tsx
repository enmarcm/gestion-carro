import { useState } from 'react'
import { CalendarClock, ChevronRight, Fuel, Gauge, Plus, Settings, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import { useApp } from '../lib/ctx'
import { toast, useDue, useFuel, useRefreshAll } from '../lib/data'
import { fmtDate, fmtKm, fmtNum, fmtUsd, numStr, toNum } from '../lib/format'
import { CatIcon } from '../lib/icons'
import { CorsaCar } from '../components/CorsaCar'
import { Ring } from '../components/charts'
import { Button, Card, Empty, Field, IconButton, NumInput, ScreenHeader, Sheet, Skeleton, StatusPill } from '../components/ui'

function OdometerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { boot } = useApp()
  const refresh = useRefreshAll()
  const [km, setKm] = useState(numStr(boot.vehicle.odometerKm))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    const n = toNum(km)
    if (n === null || Number.isNaN(n) || n < 0 || !Number.isInteger(n) || n > 2_000_000) return setErr('Ingresa un kilometraje válido')
    setBusy(true)
    try {
      await api('/vehicle', { method: 'PUT', body: { ...boot.vehicle, odometerKm: n } })
      await refresh(); toast('Kilometraje actualizado'); onClose()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) }
  }
  return (
    <Sheet open={open} onClose={onClose} title="Actualizar kilometraje" footer={<Button className="w-full" onClick={save} loading={busy}>Guardar</Button>}>
      <div className="pb-2">
        <Field label="Kilometraje actual" error={err}>{(id, inv) => <NumInput id={id} invalid={inv} inputMode="numeric" value={km} onChange={(e) => { setKm(e.target.value); setErr('') }} autoFocus />}</Field>
      </div>
    </Sheet>
  )
}

export function Home() {
  const { boot, addMaintenance, addFuel, openSettings, goto } = useApp()
  const due = useDue()
  const fuel = useFuel()
  const [odo, setOdo] = useState(false)
  const v = boot.vehicle
  const items = due.data?.items ?? []
  const urgent = items.filter((i) => i.status !== 'ok')
  const health = items.length ? Math.round((100 * items.reduce((s, i) => s + (i.status === 'ok' ? 1 : i.status === 'soon' ? 0.5 : 0), 0)) / items.length) : 100
  const f = fuel.data?.summary
  const lastFill = fuel.data?.items[0]

  return (
    <div className="grid gap-5">
      <ScreenHeader
        title="Mi Corsa"
        left={<IconButton label="Ajustes" onClick={openSettings}><Settings size={20} /></IconButton>}
      />

      <Card className="rise relative overflow-hidden !p-0">
        <div className="px-5 pt-5">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[var(--muted)]">{v.year} · {v.color || 'Verde'}{v.plate ? ` · ${v.plate}` : ''}</p>
          <h2 className="mt-1 text-[26px] font-bold leading-tight">{v.brand} {v.model}</h2>
        </div>
        <CorsaCar className="mx-auto mt-1 w-full max-w-[340px] px-2" />
        <button onClick={() => setOdo(true)} className="press neu-in mx-5 mb-5 mt-1 flex w-[calc(100%-2.5rem)] items-center justify-between gap-3 px-4 py-3 text-left" aria-label="Actualizar kilometraje">
          <span className="flex min-w-0 items-center gap-3">
            <Gauge size={22} className="shrink-0 text-[var(--green)]" />
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Kilometraje</span>
              <span className="block truncate text-[22px] font-bold leading-tight">{fmtKm(v.odometerKm)}</span>
            </span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-[var(--muted)]" />
        </button>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => addMaintenance()}><Plus size={18} />Mantenimiento</Button>
        <Button variant="soft" onClick={addFuel}><Fuel size={18} className="text-[#ec4899]" />Gasolina</Button>
      </div>

      <Card className="rise flex items-center gap-4" style={{ animationDelay: '60ms' }}>
        <Ring value={health} label="Salud" size={132} />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-bold">{urgent.length === 0 ? 'Todo al día' : `${urgent.length} por atender`}</p>
          <p className="mt-1 text-[13px] text-[var(--muted)]">
            {items.length === 0 ? 'Registra servicios para ver cuándo toca el próximo.' : `${items.filter((i) => i.status === 'overdue').length} vencidos · ${items.filter((i) => i.status === 'soon').length} pronto · ${items.filter((i) => i.status === 'ok').length} al día`}
          </p>
        </div>
      </Card>

      <section className="grid gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="flex items-center gap-2 text-[15px] font-bold"><CalendarClock size={18} className="text-[var(--violet)]" />Próximos servicios</h3>
          {items.length > 0 && <button onClick={() => goto('history')} className="text-[12px] font-bold text-[var(--green)]">Ver historial</button>}
        </div>
        {due.isLoading ? (
          <Skeleton className="h-[72px]" />
        ) : items.length === 0 ? (
          <Card><Empty icon={<Sparkles size={26} />} title="Aún sin pendientes" text="Al registrar un servicio con próximo cambio, aparecerá aquí." /></Card>
        ) : (
          items.slice(0, 6).map((i, idx) => (
            <button key={i.serviceTypeId} onClick={() => addMaintenance({ typeId: i.serviceTypeId })} className="press neu-sm rise flex w-full items-center gap-3 p-3.5 text-left" style={{ animationDelay: `${idx * 40}ms` }}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: i.categoryColor }}><CatIcon name={i.categoryIcon} size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold">{i.serviceName}</span>
                <span className="block truncate text-[12px] text-[var(--muted)]">
                  {[i.kmLeft !== null && (i.kmLeft > 0 ? `faltan ${fmtKm(i.kmLeft)}` : `pasado ${fmtKm(-i.kmLeft)}`), i.daysLeft !== null && (i.daysLeft > 0 ? `${i.daysLeft} días` : `hace ${-i.daysLeft} días`)].filter(Boolean).join(' · ')}
                </span>
              </span>
              <StatusPill status={i.status} />
            </button>
          ))
        )}
      </section>

      <section className="grid gap-3">
        <h3 className="flex items-center gap-2 px-1 text-[15px] font-bold"><Fuel size={18} className="text-[#ec4899]" />Gasolina</h3>
        {fuel.isLoading ? <Skeleton className="h-[110px]" /> : !lastFill ? (
          <Card><Empty icon={<Fuel size={26} />} title="Sin cargas todavía" text="Registra tu primera carga para ver rendimiento y gasto." /></Card>
        ) : (
          <Card className="grid gap-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="Último" value={lastFill.kmPerLiter ? `${fmtNum(lastFill.kmPerLiter)}` : '—'} unit="km/L" />
              <Stat label="Promedio" value={f?.avgKmPerLiter ? fmtNum(f.avgKmPerLiter) : '—'} unit="km/L" />
              <Stat label="Costo/km" value={f?.avgCostPerKm ? fmtUsd(f.avgCostPerKm) : '—'} />
            </div>
            <p className="text-[12px] text-[var(--muted)]">
              Última carga {fmtDate(lastFill.filledOn)} · {fmtNum(lastFill.liters)} L · {fmtUsd(lastFill.totalUsd)}
              {lastFill.distanceKm ? ` · +${fmtKm(lastFill.distanceKm)} en ${lastFill.days} días` : ''}
            </p>
          </Card>
        )}
      </section>
      {odo && <OdometerSheet open onClose={() => setOdo(false)} />}
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="neu-in min-w-0 px-2 py-3">
      <p className="truncate text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate text-[19px] font-bold">{value}</p>
      {unit && <p className="text-[11px] font-semibold text-[var(--muted)]">{unit}</p>}
    </div>
  )
}
export { Stat }
