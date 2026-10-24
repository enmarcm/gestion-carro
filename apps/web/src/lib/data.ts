import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Bootstrap, DueItem, FuelMetrics, FuelSummary, MaintenanceLog, Stats } from '@carro/shared'
import { api } from './api'

export type FuelItem = FuelMetrics & { pricePerLiterUsd: number | null; notes: string }

export const useBootstrap = (enabled = true) =>
  useQuery({ queryKey: ['bootstrap'], queryFn: () => api<Bootstrap>('/bootstrap'), staleTime: 60_000, enabled })

export const useDue = () => useQuery({ queryKey: ['due'], queryFn: () => api<{ items: DueItem[] }>('/due') })
export const useFuel = () => useQuery({ queryKey: ['fuel'], queryFn: () => api<{ items: FuelItem[]; summary: FuelSummary }>('/fuel') })
export const useStats = () => useQuery({ queryKey: ['stats'], queryFn: () => api<Stats>('/stats') })

export interface HistoryFilters { q: string; categoryId: number | null; from: string; to: string }

export function useHistory(f: HistoryFilters) {
  return useInfiniteQuery({
    queryKey: ['history', f],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const p = new URLSearchParams({ limit: '30', offset: String(pageParam) })
      if (f.q.trim()) p.set('q', f.q.trim())
      if (f.categoryId) p.set('categoryId', String(f.categoryId))
      if (f.from) p.set('from', f.from)
      if (f.to) p.set('to', f.to)
      return api<{ items: MaintenanceLog[]; total: number }>(`/maintenance?${p}`)
    },
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((s, x) => s + x.items.length, 0)
      return loaded < last.total ? loaded : undefined
    },
  })
}

/** Tras cualquier cambio de datos, refresca todo. */
export function useRefreshAll() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries()
}

export function toast(message: string, tone: 'ok' | 'error' = 'ok') {
  window.dispatchEvent(new CustomEvent('carro:toast', { detail: { message, tone } }))
}
