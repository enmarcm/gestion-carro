import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChartColumn, Fuel, History as HistoryIcon, House, LayoutGrid, CircleCheck, TriangleAlert } from 'lucide-react'
import type { MaintenanceLog } from '@carro/shared'
import { ApiError, UNAUTH_EVENT, api } from './lib/api'
import { AppCtx, type Tab } from './lib/ctx'
import { useBootstrap, type FuelItem } from './lib/data'
import { Splash } from './components/Splash'
import { MaintenanceForm } from './components/MaintenanceForm'
import { FuelForm } from './components/FuelForm'
import { Login } from './screens/Login'
import { Home } from './screens/Home'
import { Services } from './screens/Services'
import { History } from './screens/History'
import { FuelScreen } from './screens/FuelScreen'
import { StatsScreen } from './screens/StatsScreen'
import { SettingsSheet } from './screens/SettingsScreen'
import { Button, cx } from './components/ui'

const TABS: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Inicio', icon: House },
  { id: 'services', label: 'Servicios', icon: LayoutGrid },
  { id: 'fuel', label: 'Gasolina', icon: Fuel },
  { id: 'history', label: 'Historial', icon: HistoryIcon },
  { id: 'stats', label: 'Stats', icon: ChartColumn },
]

function ToastHost() {
  const [t, setT] = useState<{ message: string; tone: 'ok' | 'error'; k: number } | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ message: string; tone: 'ok' | 'error' }>).detail
      setT({ ...d, k: Date.now() })
      clearTimeout(timer)
      timer = setTimeout(() => setT(null), 3200)
    }
    window.addEventListener('carro:toast', on)
    return () => { window.removeEventListener('carro:toast', on); clearTimeout(timer) }
  }, [])
  if (!t) return null
  return (
    <div key={t.k} role="status" aria-live="polite" className="rise pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4" style={{ bottom: 'calc(var(--nav-h) + 24px + env(safe-area-inset-bottom))' }}>
      <div className="neu flex max-w-[420px] items-center gap-3 px-5 py-3 text-[14px] font-bold" style={{ borderRadius: 999 }}>
        {t.tone === 'ok' ? <CircleCheck size={20} className="shrink-0 text-[var(--ok)]" /> : <TriangleAlert size={20} className="shrink-0 text-[var(--bad)]" />}
        <span className="min-w-0">{t.message}</span>
      </div>
    </div>
  )
}

function Shell({ onLogout }: { onLogout: () => void }) {
  const { data: boot, error, refetch } = useBootstrap()
  const [tab, setTab] = useState<Tab>('home')
  const [mForm, setMForm] = useState<{ log?: MaintenanceLog | null; preset?: { categoryId?: number; typeId?: number } } | null>(null)
  const [fForm, setFForm] = useState<{ fill?: FuelItem | null } | null>(null)
  const [settings, setSettings] = useState(false)

  const closeM = useCallback(() => setMForm(null), [])
  const closeF = useCallback(() => setFForm(null), [])
  const closeS = useCallback(() => setSettings(false), [])

  const ctx = useMemo(
    () => boot && {
      boot,
      addMaintenance: (preset?: { categoryId?: number; typeId?: number }) => setMForm({ log: null, preset }),
      editMaintenance: (log: MaintenanceLog) => setMForm({ log }),
      addFuel: () => setFForm({ fill: null }),
      editFuel: (fill: FuelItem) => setFForm({ fill }),
      openSettings: () => setSettings(true),
      goto: setTab,
    },
    [boot],
  )

  useEffect(() => { window.scrollTo({ top: 0 }) }, [tab])

  if (error && !boot) {
    return (
      <main className="grid min-h-[100dvh] place-items-center px-6 text-center">
        <div className="neu grid max-w-[340px] gap-4 p-6">
          <TriangleAlert size={34} className="mx-auto text-[var(--warn)]" />
          <p className="text-[16px] font-bold">No se pudo cargar</p>
          <p className="text-[13px] text-[var(--muted)]">{error instanceof Error ? error.message : 'Error'}</p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </main>
    )
  }
  if (!boot || !ctx) return <Splash label="Preparando tu garaje…" />

  return (
    <AppCtx.Provider value={ctx}>
      <div className="mx-auto min-h-[100dvh] w-full max-w-[560px] px-4 pt-safe pb-[calc(var(--nav-h)+40px+env(safe-area-inset-bottom))] md:max-w-[760px] lg:max-w-[1250px] lg:pl-[270px] lg:pr-10 lg:pb-12">
        <main key={tab} className="fade">
          {tab === 'home' && <Home />}
          {tab === 'services' && <Services />}
          {tab === 'fuel' && <FuelScreen />}
          {tab === 'history' && <History />}
          {tab === 'stats' && <StatsScreen />}
        </main>
      </div>

      <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))] lg:inset-y-0 lg:right-auto lg:w-[250px] lg:items-start lg:justify-start lg:p-5">
        <div className="hidden w-full lg:absolute lg:left-5 lg:top-5 lg:block lg:w-[210px]">
          <p className="title-wide text-[13px]">Mi Corsa</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">Chevrolet Corsa 2001</p>
        </div>
        <ul className="neu m-0 flex h-[var(--nav-h)] w-full max-w-[520px] list-none items-center justify-between gap-1 p-2 lg:mt-20 lg:h-auto lg:w-[210px] lg:flex-col lg:items-stretch lg:justify-start lg:gap-2" style={{ borderRadius: 28 }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <li key={id} className="min-w-0 flex-1">
              <button onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined} className={cx('press grid h-full w-full place-items-center gap-0.5 py-2 lg:flex lg:h-12 lg:justify-start lg:gap-3 lg:px-4', tab === id ? 'neu-in text-[var(--green)]' : 'text-[var(--muted)]')} style={{ borderRadius: 20 }}>
                <Icon size={22} strokeWidth={tab === id ? 2.5 : 2} />
                <span className="truncate text-[10px] font-bold lg:text-[14px]">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <MaintenanceForm open={!!mForm} onClose={closeM} categories={boot.categories} today={boot.today} odometerKm={boot.vehicle.odometerKm} fxRate={boot.fx?.rate ?? null} log={mForm?.log} preset={mForm?.preset} />
      <FuelForm open={!!fForm} onClose={closeF} today={boot.today} odometerKm={boot.vehicle.odometerKm} fxRate={boot.fx?.rate ?? null} fill={fForm?.fill} />
      <SettingsSheet open={settings} onClose={closeS} onLogout={onLogout} />
      <ToastHost />
    </AppCtx.Provider>
  )
}

type Auth = 'checking' | 'out' | 'in'

export default function App() {
  const qc = useQueryClient()
  const [auth, setAuth] = useState<Auth>('checking')
  const [introDone, setIntroDone] = useState(false)

  // Mínimo 1.6 s de animación de entrada (Lottie).
  useEffect(() => { const t = setTimeout(() => setIntroDone(true), 1600); return () => clearTimeout(t) }, [])

  const me = useQuery({ queryKey: ['me'], queryFn: () => api('/auth/me'), retry: false, staleTime: Infinity })
  useEffect(() => {
    if (me.isSuccess) setAuth('in')
    else if (me.error instanceof ApiError && me.error.status === 401) setAuth('out')
    else if (me.isError) setAuth('out')
  }, [me.isSuccess, me.isError, me.error])

  useEffect(() => {
    const on = () => { qc.clear(); setAuth('out') }
    window.addEventListener(UNAUTH_EVENT, on)
    return () => window.removeEventListener(UNAUTH_EVENT, on)
  }, [qc])

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined)
    qc.clear(); setAuth('out')
  }

  if (auth === 'checking' || !introDone) return <Splash />
  if (auth === 'out') return <Login onDone={() => { qc.clear(); setAuth('in') }} />
  return <Shell onLogout={logout} />
}
