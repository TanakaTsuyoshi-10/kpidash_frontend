/**
 * 経営ダッシュボードデータ取得カスタムフック
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
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

/**
 * ダッシュボード全体データ取得
 */
export function useDashboardData(params: DashboardQueryParams = {}) {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getDashboardData(params)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [params.period_type, params.year, params.month, params.quarter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * 全社サマリー取得
 */
export function useCompanySummary(params: DashboardQueryParams = {}) {
  const [data, setData] = useState<CompanySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getCompanySummary(params)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [params.period_type, params.year, params.month, params.quarter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * キャッシュフロー取得
 */
export function useCashFlow(params: DashboardQueryParams = {}) {
  const [data, setData] = useState<CashFlowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getCashFlow(params)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [params.period_type, params.year, params.month, params.quarter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * 推移グラフデータ取得
 */
export function useDashboardChart(months: number = 12) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getChartData(months)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [months])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * ダッシュボードアラート取得
 */
export function useDashboardAlerts(params: DashboardQueryParams = {}) {
  const [data, setData] = useState<DashboardAlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getDashboardAlerts(params)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [params.period_type, params.year, params.month, params.quarter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
