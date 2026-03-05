/**
 * 予想注文のAPI関数
 */
import { apiClient } from './client'
import type {
  OrderForecastResponse,
  DailyProductBreakdownResponse,
  HourlyProductBreakdownResponse,
} from '@/types/order-forecast'

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

/**
 * 日別×商品別パック数を取得する
 */
export async function getDailyProductBreakdown(
  year: number,
  month: number,
  segmentId?: string,
  departmentSlug: string = 'store',
): Promise<DailyProductBreakdownResponse> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
    department_slug: departmentSlug,
  })
  if (segmentId) params.append('segment_id', segmentId)
  return apiClient.get<DailyProductBreakdownResponse>(`/order-forecast/daily-products?${params.toString()}`)
}

/**
 * 時間帯別×商品別パック数を取得する
 */
export async function getHourlyProductBreakdown(
  targetDate: string,
  segmentId?: string,
  departmentSlug: string = 'store',
): Promise<HourlyProductBreakdownResponse> {
  const params = new URLSearchParams({
    target_date: targetDate,
    department_slug: departmentSlug,
  })
  if (segmentId) params.append('segment_id', segmentId)
  return apiClient.get<HourlyProductBreakdownResponse>(`/order-forecast/hourly-products?${params.toString()}`)
}
