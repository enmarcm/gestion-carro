import { createContext, useContext } from 'react'
import type { Bootstrap, MaintenanceLog } from '@carro/shared'
import type { FuelItem } from './data'

export interface AppActions {
  boot: Bootstrap
  addMaintenance: (preset?: { categoryId?: number; typeId?: number }) => void
  editMaintenance: (log: MaintenanceLog) => void
  addFuel: () => void
  editFuel: (f: FuelItem) => void
  openSettings: () => void
  goto: (tab: Tab) => void
}

export type Tab = 'home' | 'services' | 'fuel' | 'history' | 'stats'

export const AppCtx = createContext<AppActions | null>(null)
export function useApp(): AppActions {
  const v = useContext(AppCtx)
  if (!v) throw new Error('AppCtx')
  return v
}
