import { Fuel, Plus } from 'lucide-react'
import { useApp } from '../lib/ctx'
import { useFuel } from '../lib/data'
import { fmtBs, fmtDate, fmtKm, fmtNum, fmtUsd } from '../lib/format'
import { Trend } from '../components/charts'
import { Button, Card, Empty, IconButton, ScreenHeader, Skeleton } from '../components/ui'
import { Stat } from './Home'

export function FuelScreen() {
  const { boot, addFuel, editFuel } = useApp()
  const { data, isLoading } = useFuel()
  const rate = boot.fx?.rate ?? null
  const s = data?.summary
  const items = data?.items ?? []
  const trend = [...items].reverse().map((i) => i.kmPerLiter).filter((x): x is number => x !== null)

  return (
    <div className="grid gap-5">
      <ScreenHeader title="Gasolina" right={<IconButton label="Cargar gasolina" onClick={addFuel}><Plus size={20} /></IconButton>} />
      {isLoading ? (
        <Skeleton className="h-[180px]" />
      ) : items.length === 0 ? (
        <Card>
          <Empty icon={<Fuel size={26} />} title="Sin cargas todavía" text="Registra cada vez que eches gasolina: te calculo rendimiento, gasto y costo por km." />
          <div className="px-4 pb-2"><Button className="w-full" onClick={addFuel}>Cargar gasolina</Button></div>
        </Card>
      ) : (
        <>
          <Card className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Promedio" value={s?.avgKmPerLiter ? fmtNum(s.avgKmPerLiter) : '—'} unit="km/L" />
              <Stat label="Última" value={s?.lastKmPerLiter ? fmtNum(s.lastKmPerLiter) : '—'} unit="km/L" />
              <Stat label="Costo/km" value={s?.avgCostPerKm ? fmtUsd(s.avgCostPerKm) : '—'} />
              <Stat label="Cada" value={s?.avgDaysBetween ? fmtNum(s.avgDaysBetween, 0) : '—'} unit="días" />
            </div>
            {trend.length >= 2 && (
              <div>
                <p className="mb-1 px-1 text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]">Rendimiento (km/L)</p>
                <Trend points={trend} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <p className="neu-in px-3 py-2"><span className="text-[var(--muted)]">Total litros</span><br /><b>{fmtNum(s?.totalLiters ?? 0)} L</b></p>
              <p className="neu-in px-3 py-2"><span className="text-[var(--muted)]">Gastado</span><br /><b>{fmtUsd(s?.totalUsd ?? 0)}</b> <span className="text-[11px] text-[var(--muted)]">{fmtBs(s?.totalUsd, rate)}</span></p>
            </div>
          </Card>

          <section className="grid gap-3">
            <h3 className="px-1 text-[12px] font-bold uppercase tracking-widest text-[var(--muted)]">Cargas</h3>
            {items.map((i) => (
              <button key={i.id} onClick={() => editFuel(i)} className="press neu-sm grid w-full gap-2 p-4 text-left">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[15px] font-bold">{fmtDate(i.filledOn)}</span>
                  <span className="text-right">
                    <span className="text-[15px] font-bold">{fmtUsd(i.totalUsd)}</span>
                    <span className="ml-2 text-[11px] text-[var(--muted)]">{fmtBs(i.totalUsd, rate)}</span>
                  </span>
                </span>
                <span className="text-[12px] text-[var(--muted)]">
                  {fmtNum(i.liters)} L · {fmtKm(i.odometerKm)}{!i.fullTank ? ' · parcial' : ''}
                </span>
                {i.distanceKm !== null && (
                  <span className="flex flex-wrap gap-2 text-[11px] font-bold">
                    <Tag>+{fmtKm(i.distanceKm)}</Tag>
                    <Tag>{i.days} día{i.days === 1 ? '' : 's'}</Tag>
                    {i.kmPerLiter && <Tag color="#1f9d6b">{fmtNum(i.kmPerLiter)} km/L</Tag>}
                    {i.costPerKm && <Tag color="#7c5ce0">{fmtUsd(i.costPerKm)}/km</Tag>}
                  </span>
                )}
              </button>
            ))}
          </section>
        </>
      )}
    </div>
  )
}

const Tag = ({ children, color = '#64748b' }: { children: React.ReactNode; color?: string }) => (
  <span className="rounded-full px-2.5 py-1" style={{ color, background: `${color}1c` }}>{children}</span>
)
