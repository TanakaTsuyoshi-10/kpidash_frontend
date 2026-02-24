/**
 * 経営ダッシュボードデータ取得カスタムフック（SWR版）
 */
'use client'

import useSWR from 'swr'
import {
  getDashboardData,
  getCompanySummary,
  getCashFlow,
  getChartData,
  getDashboardAlerts,
} from '@/lib/api/dashboard'
import type {
  DashboardResponse,
  CompanySummary,
  CashFlowData,
  ChartDataPoint,
  DashboardAlertItem,
  DashboardQueryParams,
} from '@/types/dashboard'

function buildDashboardKey(params: DashboardQueryParams) {
  const p = new URLSearchParams()
  if (params.period_type) p.append('period_type', params.period_type)
  if (params.year !== undefined) p.append('year', params.year.toString())
  if (params.month !== undefined) p.append('month', params.month.toString())
  if (params.quarter !== undefined) p.append('quarter', params.quarter.toString())
  return `/api/v1/dashboard${p.toString() ? `?${p}` : ''}`
}

/**
 * ダッシュボード全体データ取得
 */
export function useDashboardData(params: DashboardQueryParams = {}) {
  const key = buildDashboardKey(params)

  const { data, error, isLoading, mutate } = useSWR<DashboardResponse>(
    key,
    () => getDashboardData(params),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, error: error?.message || null, refetch: mutate }
}

/**
 * 全社サマリー取得
 */
export function useCompanySummary(params: DashboardQueryParams = {}) {
  const key = buildDashboardKey(params) + '#company-summary'

  const { data, error, isLoading, mutate } = useSWR<CompanySummary>(
    key,
    () => getCompanySummary(params),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, error: error?.message || null, refetch: mutate }
}

/**
 * キャッシュフロー取得
 */
export function useCashFlow(params: DashboardQueryParams = {}) {
  const key = buildDashboardKey(params) + '#cashflow'

  const { data, error, isLoading, mutate } = useSWR<CashFlowData>(
    key,
    () => getCashFlow(params),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, error: error?.message || null, refetch: mutate }
}

/**
 * 推移グラフデータ取得
 */
export function useDashboardChart(months: number = 12) {
  const { data, error, isLoading, mutate } = useSWR<ChartDataPoint[]>(
    `/api/v1/dashboard/chart?months=${months}`,
    () => getChartData(months),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? [], loading: isLoading, error: error?.message || null, refetch: mutate }
}

/**
 * ダッシュボードアラート取得
 */
export function useDashboardAlerts(params: DashboardQueryParams = {}) {
  const key = buildDashboardKey(params) + '#alerts'

  const { data, error, isLoading, mutate } = useSWR<DashboardAlertItem[]>(
    key,
    () => getDashboardAlerts(params),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? [], loading: isLoading, error: error?.message || null, refetch: mutate }
}
