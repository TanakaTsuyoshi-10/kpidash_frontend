/**
 * ふるさと納税分析のデータ取得フック（SWR版）
 */
'use client'

import useSWR from 'swr'
import { getFurusatoSummary } from '@/lib/api/furusato'
import type { FurusatoSummaryResponse } from '@/types/furusato'
import type { PeriodType } from '@/types/ecommerce'

/**
 * ふるさと納税サマリーを取得するフック
 */
export function useFurusatoSummary(month: string, periodType: PeriodType = 'monthly') {
  const key = month ? `/furusato/summary?month=${month}&period_type=${periodType}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<FurusatoSummaryResponse>(
    key,
    () => getFurusatoSummary(month, periodType),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}
