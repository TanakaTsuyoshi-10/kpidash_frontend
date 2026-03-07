/**
 * 店舗別売上推移データ取得フック（SWR版）
 */
'use client'

import useSWR from 'swr'
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
  const targetFiscalYear = fiscalYear ?? getCurrentFiscalYear()
  const key = `/products/store-trend-all?dept=${departmentSlug}&fy=${targetFiscalYear}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<StoreTrendAllData>(
    key,
    () => {
      const params = new URLSearchParams({
        department_slug: departmentSlug,
        fiscal_year: targetFiscalYear.toString(),
      })
      return apiClient.get<StoreTrendAllData>(
        `/products/store-trend-all?${params.toString()}`
      )
    },
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 単一店舗の推移データを取得（前々年比較）
 */
export function useStoreTrendSingle(
  segmentId: string | null,
  departmentSlug: string = 'store',
  fiscalYear?: number
) {
  const targetFiscalYear = fiscalYear ?? getCurrentFiscalYear()
  const key = segmentId
    ? `/products/store-trend/${segmentId}?dept=${departmentSlug}&fy=${targetFiscalYear}`
    : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<StoreTrendSingleData>(
    key,
    () => {
      const params = new URLSearchParams({
        department_slug: departmentSlug,
        fiscal_year: targetFiscalYear.toString(),
      })
      return apiClient.get<StoreTrendSingleData>(
        `/products/store-trend/${segmentId}?${params.toString()}`
      )
    },
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}
