/**
 * 人事（HR）用カスタムフック（SWR版）
 * SmartHR連携による部署別 人件費・時間外労働を取得する。
 */
'use client'

import useSWR from 'swr'
import { fetchLaborSummary } from '@/lib/api/hr'
import type { LaborSummaryResponse } from '@/types/hr'

/**
 * 部署別 人件費・時間外サマリー取得フック
 */
export function useLaborSummary() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LaborSummaryResponse>(
    '/hr/labor-summary',
    () => fetchLaborSummary(),
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
