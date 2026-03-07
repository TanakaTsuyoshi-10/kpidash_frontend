/**
 * KPIデータ取得カスタムフック（SWR版）
 * - 部門サマリー
 * - 店舗詳細
 * - グラフデータ
 * - ランキング
 * - アラート
 */
'use client'

import useSWR from 'swr'
import { apiClient } from '@/lib/api/client'
import { DepartmentSummary, SegmentDetail, AlertItem } from '@/types/kpi'

// グラフデータの型定義
export interface ChartData {
  kpi_name: string
  fiscal_year: number
  labels: string[]
  datasets: {
    actual: number[]
    target: number[]
    previous_year?: number[]
  }
}

// ランキングアイテムの型定義
export interface RankingItem {
  rank: number
  segment_id: string
  segment_name: string
  value: number
  achievement_rate: number | null
}

// 現在の会計年度を取得（9月起点）
function getCurrentFiscalYear(): number {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  return month >= 9 ? year : year - 1
}

// 部門サマリー取得
export function useDepartmentSummary(departmentSlug: string, month?: string) {
  const params = new URLSearchParams({ department_slug: departmentSlug })
  if (month) params.append('month', month)
  const key = `/kpi/summary?${params}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<DepartmentSummary>(
    key,
    () => apiClient.get<DepartmentSummary>(`/kpi/summary?${params}`),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

// 店舗詳細取得
export function useSegmentDetail(segmentId: string | null, month?: string) {
  const params = month ? `?month=${month}` : ''
  const key = segmentId ? `/kpi/segment/${segmentId}${params}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<SegmentDetail>(
    key,
    () => apiClient.get<SegmentDetail>(`/kpi/segment/${segmentId}${params}`),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

// グラフデータ取得
export function useChartData(departmentSlug: string, kpiName: string = '売上高', fiscalYear?: number) {
  const targetFiscalYear = fiscalYear ?? getCurrentFiscalYear()
  const params = new URLSearchParams({
    department_slug: departmentSlug,
    kpi_name: kpiName,
    fiscal_year: targetFiscalYear.toString()
  })
  const key = `/kpi/chart?${params}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<ChartData>(
    key,
    () => apiClient.get<ChartData>(`/kpi/chart?${params}`),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

// ランキング取得
export function useRanking(departmentSlug: string, kpiName: string = '売上高', month?: string) {
  const params = new URLSearchParams({
    department_slug: departmentSlug,
    kpi_name: kpiName
  })
  if (month) params.append('month', month)
  const key = `/kpi/ranking?${params}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<RankingItem[]>(
    key,
    () => apiClient.get<RankingItem[]>(`/kpi/ranking?${params}`),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? [], loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

// アラート取得
export function useAlerts(departmentSlug?: string) {
  const params = departmentSlug ? `?department_slug=${departmentSlug}` : ''
  const key = `/kpi/alerts${params}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<AlertItem[]>(
    key,
    () => apiClient.get<AlertItem[]>(`/kpi/alerts${params}`),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? [], loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}
