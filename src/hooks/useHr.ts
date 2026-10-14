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
export function useLaborSummary(month?: string) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LaborSummaryResponse>(
    month ? `/hr/labor-summary?month=${month}` : '/hr/labor-summary',
    () => fetchLaborSummary(month),
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

import {
  fetchHeadcount,
  fetchHeadcountTrend,
  fetchTurnover,
  fetchOrgHealth,
  fetchStoreLabor,
} from '@/lib/api/hr'
import type {
  HeadcountSummaryResponse,
  HeadcountTrendResponse,
  TurnoverResponse,
  OrgHealthResponse,
  StoreLaborResponse,
} from '@/types/hr'

const HR_SWR_OPTS = { dedupingInterval: 300000 }

export function useHeadcount() {
  const { data, error, isLoading } = useSWR<HeadcountSummaryResponse>(
    '/hr/headcount', () => fetchHeadcount(), HR_SWR_OPTS)
  return { data: data ?? null, loading: isLoading, error: error?.message || null }
}

export function useHeadcountTrend(months = 36) {
  const { data, error, isLoading } = useSWR<HeadcountTrendResponse>(
    `/hr/headcount-trend?months=${months}`, () => fetchHeadcountTrend(months), HR_SWR_OPTS)
  return { data: data ?? null, loading: isLoading, error: error?.message || null }
}

export function useTurnover(months = 12) {
  const { data, error, isLoading } = useSWR<TurnoverResponse>(
    `/hr/turnover?months=${months}`, () => fetchTurnover(months), HR_SWR_OPTS)
  return { data: data ?? null, loading: isLoading, error: error?.message || null }
}

export function useOrgHealth() {
  const { data, error, isLoading } = useSWR<OrgHealthResponse>(
    '/hr/org-health', () => fetchOrgHealth(), HR_SWR_OPTS)
  return { data: data ?? null, loading: isLoading, error: error?.message || null }
}

export function useStoreLabor(month: string) {
  const { data, error, isLoading } = useSWR<StoreLaborResponse>(
    `/hr/store-labor?month=${month}`, () => fetchStoreLabor(month), HR_SWR_OPTS)
  return { data: data ?? null, loading: isLoading, error: error?.message || null }
}
