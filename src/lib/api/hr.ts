/**
 * 人事（HR）API
 * SmartHR連携による部署別 人件費・時間外労働を取得する。
 */
import { apiClient } from './client'
import type { LaborSummaryResponse } from '@/types/hr'

const BASE_PATH = '/api/v1/hr'

/**
 * 部署別 人件費・時間外サマリー取得
 */
export async function fetchLaborSummary(
  month?: string
): Promise<LaborSummaryResponse> {
  const query = month ? `?month=${encodeURIComponent(month)}` : ''
  return apiClient.get<LaborSummaryResponse>(
    `${BASE_PATH}/labor-summary${query}`
  )
}

import type {
  HeadcountSummaryResponse,
  HeadcountTrendResponse,
  TurnoverResponse,
  OrgHealthResponse,
  StoreLaborResponse,
} from '@/types/hr'

export async function fetchHeadcount(): Promise<HeadcountSummaryResponse> {
  return apiClient.get<HeadcountSummaryResponse>(`${BASE_PATH}/headcount`)
}

export async function fetchHeadcountTrend(months = 36): Promise<HeadcountTrendResponse> {
  return apiClient.get<HeadcountTrendResponse>(`${BASE_PATH}/headcount-trend?months=${months}`)
}

export async function fetchTurnover(months = 12): Promise<TurnoverResponse> {
  return apiClient.get<TurnoverResponse>(`${BASE_PATH}/turnover?months=${months}`)
}

export async function fetchOrgHealth(): Promise<OrgHealthResponse> {
  return apiClient.get<OrgHealthResponse>(`${BASE_PATH}/org-health`)
}

export async function fetchStoreLabor(month: string): Promise<StoreLaborResponse> {
  return apiClient.get<StoreLaborResponse>(`${BASE_PATH}/store-labor?month=${encodeURIComponent(month)}`)
}
