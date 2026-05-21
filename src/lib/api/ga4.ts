/**
 * EC Web分析（GA4連携）のAPI関数
 */
import { apiClient } from './client'
import type { GA4EcSummary } from '@/types/ga4'

const BASE_PATH = '/api/v1/ga4'

/**
 * EC Web分析サマリーを取得
 */
export async function fetchGa4EcSummary(): Promise<GA4EcSummary> {
  return apiClient.get<GA4EcSummary>(`${BASE_PATH}/ec-summary`)
}
