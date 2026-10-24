import { ChartColumn } from 'lucide-react'
import { useApp } from '../lib/ctx'
import { useStats } from '../lib/data'
import { fmtBs, fmtUsd } from '../lib/format'
import { MonthBars, ShareBar } from '../components/charts'
import { Card, Empty, ScreenHeader, Skeleton } from '../components/ui'

export function StatsScreen() {
  const { boot } = useApp()
  const { data, isLoading } = useStats()
  const rate = boot.fx?.rate ?? null
  const t = data?.totals
  const total = (t?.maintenanceUsd ?? 0) + (t?.fuelUsd ?? 0)
  const maxCat = Math.max(1, ...(data?.byCategory.map((c) => c.totalUsd) ?? [1]))

  return (
    <div className="grid gap-5">
      <ScreenHeader title="Estadísticas" />
      {isLoading ? (
        <Skeleton className="h-[260px]" />
      ) : !data || total === 0 ? (
        <Card><Empty icon={<ChartColumn size={26} />} title="Sin datos aún" text="Cuando registres servicios con costo y cargas de gasolina verás tus gastos aquí." /></Card>
      ) : (
        <>
          <Card className="grid gap-3">
            <p className="text-[12px] font-bold uppercase tracking-widest text-[var(--muted)]">Gasto total</p>
            <p className="text-[34px] font-bold leading-none">{fmtUsd(total)}</p>
            <p className="text-[13px] text-[var(--muted)]">{fmtBs(total, rate)}{rate ? ` · BCV ${rate.toLocaleString('es-VE', { maximumFractionDigits: 2 })}` : ''}</p>
            <div className="mt-1 grid grid-cols-2 gap-3 text-[13px]">
              <p className="neu-in px-3 py-2"><span className="text-[var(--muted)]">Mantenimiento</span><br /><b>{fmtUsd(t?.maintenanceUsd)}</b></p>
              <p className="neu-in px-3 py-2"><span className="text-[var(--muted)]">Gasolina</span><br /><b>{fmtUsd(t?.fuelUsd)}</b></p>
            </div>
          </Card>

          <Card className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-bold">Por mes</h3>
              <div className="flex items-center gap-3 text-[11px] font-bold text-[var(--muted)]">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#4a8cf0]" />Servicios</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#f0627e]" />Gasolina</span>
              </div>
            </div>
            <MonthBars data={data.byMonth} />
          </Card>

          {data.byCategory.length > 0 && (
            <Card className="grid gap-4">
              <h3 className="text-[15px] font-bold">Mantenimiento por categoría</h3>
              {data.byCategory.map((c) => (
                <div key={c.categoryId} className="grid gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-[14px]">
                    <span className="min-w-0 truncate font-bold">{c.name} <span className="text-[11px] font-semibold text-[var(--muted)]">· {c.count}</span></span>
                    <span className="shrink-0 font-bold">{fmtUsd(c.totalUsd)}</span>
                  </div>
                  <ShareBar pct={(c.totalUsd / maxCat) * 100} color={c.color} />
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  )
}
