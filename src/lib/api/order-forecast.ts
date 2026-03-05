/**
 * 予想注文のAPI関数
 */
import { apiClient } from './client'
import type { OrderForecastResponse } from '@/types/order-forecast'

/**
 * 予想注文データを取得する
 */
export async function getOrderForecast(
  targetDate: string,
  segmentId?: string,
  departmentSlug: string = 'store',
): Promise<OrderForecastResponse> {
  const params = new URLSearchParams({
    target_date: targetDate,
    department_slug: departmentSlug,
  })
  if (segmentId) params.append('segment_id', segmentId)
  return apiClient.get<OrderForecastResponse>(`/order-forecast?${params.toString()}`)
}
