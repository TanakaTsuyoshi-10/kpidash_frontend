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
export async function fetchLaborSummary(): Promise<LaborSummaryResponse> {
  return apiClient.get<LaborSummaryResponse>(`${BASE_PATH}/labor-summary`)
}
