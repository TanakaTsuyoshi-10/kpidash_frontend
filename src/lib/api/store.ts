/**
 * 店舗分析のAPI関数
 */
import { apiClient } from './client'
import type { StoreSummaryResponse, PeriodType } from '@/hooks/useStoreSummary'

/**
 * 店舗別集計データを取得
 */
export async function getStoreSummary(
  month: string,
  departmentSlug: string = 'store',
  periodType: PeriodType = 'monthly'
): Promise<StoreSummaryResponse> {
  const params = new URLSearchParams({
    month,
    department_slug: departmentSlug,
    period_type: periodType,
  })
  return apiClient.get<StoreSummaryResponse>(`/products/store-summary?${params.toString()}`)
}
