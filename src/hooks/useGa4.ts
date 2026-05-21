/**
 * EC Web分析（GA4連携）のデータ取得フック（SWR版）
 */
'use client'

import useSWR from 'swr'
import { fetchGa4EcSummary } from '@/lib/api/ga4'
import type { GA4EcSummary } from '@/types/ga4'

/**
 * EC Web分析サマリーを取得するフック
 */
export function useGa4EcSummary() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<GA4EcSummary>(
    '/api/v1/ga4/ec-summary',
    () => fetchGa4EcSummary(),
    { dedupingInterval: 300000 }
  )

  return {
    data: data ?? null,
    loading: isLoading,
    validating: isValidating,
    error: error?.message || null,
    refetch: mutate,
  }
}
