/**
 * 経営ダッシュボードデータ取得カスタムフック（SWR版）
 *
 * グローバル fetcher（swr-config.tsx）を使用。
 * SWR key = 実際のAPIパスにすることで preload() と fetcher が一致し、
 * ログイン直後のプリロードデータが確実に適用される。
 */
'use client'

import useSWR from 'swr'
import type {
  DashboardResponse,
  CompanySummary,
  CashFlowData,
  ChartDataPoint,
  DashboardAlertItem,
  DashboardQueryParams,
} from '@/types/dashboard'

function buildQueryString(params: DashboardQueryParams) {
  const p = new URLSearchParams()
  if (params.period_type) p.append('period_type', params.period_type)
  if (params.year !== undefined) p.append('year', params.year.toString())
  if (params.month !== undefined) p.append('month', params.month.toString())
  if (params.quarter !== undefined) p.append('quarter', params.quarter.toString())
  return p.toString() ? `?${p}` : ''
}

/**
 * ダッシュボード全体データ取得
 */
export function useDashboardData(params: DashboardQueryParams = {}) {
  const key = `/api/v1/dashboard${buildQueryString(params)}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardResponse>(
    key,
    { dedupingInterval: 300000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 全社サマリー取得
 */
export function useCompanySummary(params: DashboardQueryParams = {}) {
  const key = `/api/v1/dashboard/summary${buildQueryString(params)}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<CompanySummary>(
    key,
    { dedupingInterval: 300000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * キャッシュフロー取得
 */
export function useCashFlow(params: DashboardQueryParams = {}) {
  const key = `/api/v1/dashboard/cashflow${buildQueryString(params)}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<CashFlowData>(
    key,
    { dedupingInterval: 300000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 推移グラフデータ取得
 */
export function useDashboardChart(months: number = 12) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ChartDataPoint[]>(
    `/api/v1/dashboard/chart?months=${months}`,
    { dedupingInterval: 300000 }
  )

  return { data: data ?? [], loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * ダッシュボードアラート取得
 */
export function useDashboardAlerts(params: DashboardQueryParams = {}) {
  const key = `/api/v1/dashboard/alerts${buildQueryString(params)}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardAlertItem[]>(
    key,
    { dedupingInterval: 300000 }
  )

  return { data: data ?? [], loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}
