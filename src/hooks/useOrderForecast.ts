/**
 * 予想注文データ取得フック（SWR版）
 */
'use client'

import useSWR from 'swr'
import {
  getOrderForecast,
  getDailyProductBreakdown,
  getHourlyProductBreakdown,
} from '@/lib/api/order-forecast'
import type {
  OrderForecastResponse,
  DailyProductBreakdownResponse,
  HourlyProductBreakdownResponse,
} from '@/types/order-forecast'

/**
 * 予想注文データを取得するフック
 */
export function useOrderForecast(
  targetDate: string,
  segmentId?: string,
  departmentSlug: string = 'store',
) {
  const params = new URLSearchParams({
    target_date: targetDate,
    department_slug: departmentSlug,
  })
  if (segmentId) params.append('segment_id', segmentId)
  const key = targetDate ? `/order-forecast?${params.toString()}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<OrderForecastResponse>(
    key,
    () => getOrderForecast(targetDate, segmentId, departmentSlug),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 日別×商品別パック数を取得するフック
 */
export function useDailyProductBreakdown(
  year: number,
  month: number,
  segmentId?: string,
  departmentSlug: string = 'store',
) {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
    department_slug: departmentSlug,
  })
  if (segmentId) params.append('segment_id', segmentId)
  const key = year && month ? `/order-forecast/daily-products?${params.toString()}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<DailyProductBreakdownResponse>(
    key,
    () => getDailyProductBreakdown(year, month, segmentId, departmentSlug),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 時間帯別×商品別パック数を取得するフック
 */
export function useHourlyProductBreakdown(
  targetDate: string | null,
  segmentId?: string,
  departmentSlug: string = 'store',
) {
  const params = new URLSearchParams({ department_slug: departmentSlug })
  if (targetDate) params.append('target_date', targetDate)
  if (segmentId) params.append('segment_id', segmentId)
  const key = targetDate ? `/order-forecast/hourly-products?${params.toString()}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<HourlyProductBreakdownResponse>(
    key,
    () => getHourlyProductBreakdown(targetDate!, segmentId, departmentSlug),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}
