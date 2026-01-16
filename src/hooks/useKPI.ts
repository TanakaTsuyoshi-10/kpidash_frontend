/**
 * KPIデータ取得カスタムフック
 * - 部門サマリー
 * - 店舗詳細
 * - グラフデータ
 * - ランキング
 * - アラート
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
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

// 部門サマリー取得
export function useDepartmentSummary(departmentSlug: string, month?: string) {
  const [data, setData] = useState<DepartmentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ department_slug: departmentSlug })
      if (month) params.append('month', month)
      const result = await apiClient.get<DepartmentSummary>(`/kpi/summary?${params}`)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [departmentSlug, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// 店舗詳細取得
export function useSegmentDetail(segmentId: string | null, month?: string) {
  const [data, setData] = useState<SegmentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!segmentId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = month ? `?month=${month}` : ''
        const result = await apiClient.get<SegmentDetail>(`/kpi/segment/${segmentId}${params}`)
        setData(result)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [segmentId, month])

  return { data, loading, error }
}

// 現在の会計年度を取得（9月起点）
function getCurrentFiscalYear(): number {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  return month >= 9 ? year : year - 1
}

// グラフデータ取得
export function useChartData(departmentSlug: string, kpiName: string = '売上高', fiscalYear?: number) {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const targetFiscalYear = fiscalYear ?? getCurrentFiscalYear()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          department_slug: departmentSlug,
          kpi_name: kpiName,
          fiscal_year: targetFiscalYear.toString()
        })
        const result = await apiClient.get<ChartData>(`/kpi/chart?${params}`)
        setData(result)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [departmentSlug, kpiName, targetFiscalYear])

  return { data, loading, error }
}

// ランキング取得
export function useRanking(departmentSlug: string, kpiName: string = '売上高', month?: string) {
  const [data, setData] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          department_slug: departmentSlug,
          kpi_name: kpiName
        })
        if (month) params.append('month', month)
        const result = await apiClient.get<RankingItem[]>(`/kpi/ranking?${params}`)
        setData(result)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [departmentSlug, kpiName, month])

  return { data, loading, error }
}

// アラート取得
export function useAlerts(departmentSlug?: string) {
  const [data, setData] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const params = departmentSlug ? `?department_slug=${departmentSlug}` : ''
        const result = await apiClient.get<AlertItem[]>(`/kpi/alerts${params}`)
        setData(result)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [departmentSlug])

  return { data, loading, error }
}
