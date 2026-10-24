import { useEffect, useMemo, useState } from 'react'
import { History as HistoryIcon, ListFilter, Search, X } from 'lucide-react'
import { useApp } from '../lib/ctx'
import { useHistory, type HistoryFilters } from '../lib/data'
import { fmtBs, fmtDate, fmtKm, fmtMonth, fmtUsd } from '../lib/format'
import { CatIcon } from '../lib/icons'
import { Button, Card, Chip, DateInput, Empty, Field, IconButton, ScreenHeader, Skeleton } from '../components/ui'

function useDebounced<T>(v: T, ms = 300): T {
  const [d, setD] = useState(v)
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t) }, [v, ms])
  return d
}

export function History() {
  const { boot, editMaintenance, addMaintenance } = useApp()
  const [q, setQ] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const dq = useDebounced(q)
  const filters: HistoryFilters = { q: dq, categoryId, from, to }
  const hist = useHistory(filters)
  const items = useMemo(() => hist.data?.pages.flatMap((p) => p.items) ?? [], [hist.data])
  const total = hist.data?.pages[0]?.total ?? 0
  const groups = useMemo(() => {
    const m = new Map<string, typeof items>()
    for (const it of items) { const k = it.performedOn.slice(0, 7); m.set(k, [...(m.get(k) ?? []), it]) }
    return [...m.entries()]
  }, [items])
  const rate = boot.fx?.rate ?? null
  const activeFilters = (categoryId ? 1 : 0) + (from ? 1 : 0) + (to ? 1 : 0)

  return (
    <div className="grid gap-4">
      <ScreenHeader title="Historial" right={<IconButton label="Filtros" onClick={() => setShowFilters((s) => !s)} className={showFilters || activeFilters ? 'text-[var(--green)]' : ''}><ListFilter size={19} /></IconButton>} />
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input className="field pl-11 pr-11" placeholder="Buscar en el historial…" aria-label="Buscar en el historial" value={q} onChange={(e) => setQ(e.target.value)} maxLength={60} />
        {q && <button aria-label="Limpiar" onClick={() => setQ('')} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-[var(--muted)]"><X size={18} /></button>}
      </div>

      {showFilters && (
        <Card className="rise grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde">{(id) => <DateInput id={id} value={from} onChange={(e) => setFrom(e.target.value)} />}</Field>
            <Field label="Hasta">{(id) => <DateInput id={id} value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
          </div>
          <Button variant="soft" onClick={() => { setFrom(''); setTo(''); setCategoryId(null) }}>Limpiar filtros</Button>
        </Card>
      )}

      <div className="scroll-y -mx-4 flex gap-3 px-4 py-2" role="group" aria-label="Filtrar por categoría">
        <Chip active={categoryId === null} onClick={() => setCategoryId(null)}>Todas</Chip>
        {boot.categories.map((c) => <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>{c.name}</Chip>)}
      </div>

      {hist.isLoading ? (
        <div className="grid gap-3"><Skeleton className="h-[78px]" /><Skeleton className="h-[78px]" /><Skeleton className="h-[78px]" /></div>
      ) : items.length === 0 ? (
        <Card>
          <Empty icon={<HistoryIcon size={26} />} title={q || activeFilters ? 'Nada coincide' : 'Aún no hay registros'} text={q || activeFilters ? 'Ajusta la búsqueda o los filtros.' : 'Registra tu primer mantenimiento para empezar el historial.'} />
          {!q && !activeFilters && <div className="px-4 pb-2"><Button className="w-full" onClick={() => addMaintenance()}>Registrar mantenimiento</Button></div>}
        </Card>
      ) : (
        <>
          <p className="px-1 text-[12px] font-bold text-[var(--muted)]">{total} registro{total === 1 ? '' : 's'}</p>
          {groups.map(([month, rows]) => (
            <section key={month} className="grid gap-3">
              <h3 className="px-1 text-[12px] font-bold uppercase tracking-widest text-[var(--muted)]">{fmtMonth(month)}</h3>
              {rows.map((l) => (
                <button key={l.id} onClick={() => editMaintenance(l)} className="press neu-sm flex w-full items-center gap-3 p-3.5 text-left">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: l.categoryColor }}><CatIcon name={l.categoryIcon} size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{l.serviceName}{l.detail ? ` · ${l.detail}` : ''}</span>
                    <span className="block truncate text-[12px] text-[var(--muted)]">{fmtDate(l.performedOn)} · {fmtKm(l.odometerKm)}{l.shop ? ` · ${l.shop}` : ''}</span>
                  </span>
                  {l.costUsd !== null && (
                    <span className="shrink-0 text-right">
                      <span className="block text-[14px] font-bold">{fmtUsd(l.costUsd)}</span>
                      <span className="block text-[10px] text-[var(--muted)]">{fmtBs(l.costUsd, l.fxRate ?? rate)}</span>
                    </span>
                  )}
                </button>
              ))}
            </section>
          ))}
          {hist.hasNextPage && <Button variant="soft" onClick={() => hist.fetchNextPage()} loading={hist.isFetchingNextPage}>Cargar más</Button>}
        </>
      )}
    </div>
  )
}
