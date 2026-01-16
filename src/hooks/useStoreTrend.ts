/**
 * 店舗別売上推移データ取得フック
 */
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api/client'

// 店舗推移データ（全店舗）
export interface StoreTrendAllData {
  months: string[]  // ["2025-09", "2025-10", ...]
  stores: {
    segment_id: string
    segment_name: string
    values: (number | null)[]  // 各月の売上
  }[]
}

// 店舗推移データ（単一店舗・前々年比較）
export interface StoreTrendSingleData {
  segment_id: string
  segment_name: string
  months: string[]  // ["2025-09", "2025-10", ...]
  actual: (number | null)[]        // 当年実績
  previous_year: (number | null)[] // 前年実績
  two_years_ago: (number | null)[] // 前々年実績
  summary: {
    total: number | null
    total_previous_year: number | null
    total_two_years_ago: number | null
    yoy_rate: number | null
  }
}

// 現在の会計年度を取得（9月起点）
function getCurrentFiscalYear(): number {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  return month >= 9 ? year : year - 1
}

/**
 * 全店舗の推移データを取得
 */
export function useStoreTrendAll(departmentSlug: string = 'store', fiscalYear?: number) {
  const [data, setData] = useState<StoreTrendAllData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const targetFiscalYear = fiscalYear ?? getCurrentFiscalYear()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        department_slug: departmentSlug,
        fiscal_year: targetFiscalYear.toString(),
      })
      const result = await apiClient.get<StoreTrendAllData>(
        `/products/store-trend-all?${params.toString()}`
      )
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [departmentSlug, targetFiscalYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * 単一店舗の推移データを取得（前々年比較）
 */
export function useStoreTrendSingle(
  segmentId: string | null,
  departmentSlug: string = 'store',
  fiscalYear?: number
) {
  const [data, setData] = useState<StoreTrendSingleData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const targetFiscalYear = fiscalYear ?? getCurrentFiscalYear()

  const fetchData = useCallback(async () => {
    if (!segmentId) {
      setData(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        department_slug: departmentSlug,
        fiscal_year: targetFiscalYear.toString(),
      })
      const result = await apiClient.get<StoreTrendSingleData>(
        `/products/store-trend/${segmentId}?${params.toString()}`
      )
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [segmentId, departmentSlug, targetFiscalYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
