/**
 * 通販分析のデータ取得フック（SWR版）
 */
'use client'


import useSWR from 'swr'
import {
  getChannelSummary,
  getProductSummary,
  getCustomerSummary,
  getWebsiteStats,
  getEcommerceTrend,
} from '@/lib/api/ecommerce'
import type {
  ChannelSummaryResponse,
  ProductSummaryResponse,
  CustomerSummaryResponse,
  WebsiteStatsResponse,
  TrendResponse,
  PeriodType,
} from '@/types/ecommerce'

/**
 * チャネル別実績を取得するフック
 */
export function useChannelSummary(month: string, periodType: PeriodType = 'monthly') {
  const key = month ? `/ecommerce/channel-summary?month=${month}&period_type=${periodType}` : null

  const { data, error, isLoading, mutate } = useSWR<ChannelSummaryResponse>(
    key,
    () => getChannelSummary(month, periodType),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, error: error?.message || null, refetch: mutate }
}

/**
 * 商品別実績を取得するフック
 */
export function useProductSummary(
  month: string,
  periodType: PeriodType = 'monthly',
  limit: number = 20
) {
  const key = month
    ? `/ecommerce/product-summary?month=${month}&period_type=${periodType}&limit=${limit}`
    : null

  const { data, error, isLoading, mutate } = useSWR<ProductSummaryResponse>(
    key,
    () => getProductSummary(month, periodType, limit),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, error: error?.message || null, refetch: mutate }
}

/**
 * 顧客別実績を取得するフック
 */
export function useCustomerSummary(month: string, periodType: PeriodType = 'monthly') {
  const key = month ? `/ecommerce/customer-summary?month=${month}&period_type=${periodType}` : null

  const { data, error, isLoading, mutate } = useSWR<CustomerSummaryResponse>(
    key,
    () => getCustomerSummary(month, periodType),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, error: error?.message || null, refetch: mutate }
}

/**
 * HPアクセス数を取得するフック
 */
export function useWebsiteStats(month: string, periodType: PeriodType = 'monthly') {
  const key = month ? `/ecommerce/website-stats?month=${month}&period_type=${periodType}` : null

  const { data, error, isLoading, mutate } = useSWR<WebsiteStatsResponse>(
    key,
    () => getWebsiteStats(month, periodType),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, error: error?.message || null, refetch: mutate }
}

/**
 * 推移データを取得するフック
 */
export function useEcommerceTrend(
  metric: 'channel_sales' | 'product_sales' | 'customers' | 'website',
  fiscalYear?: number
) {
  const key = fiscalYear
    ? `/ecommerce/trend?metric=${metric}&fiscal_year=${fiscalYear}`
    : `/ecommerce/trend?metric=${metric}`

  const { data, error, isLoading, mutate } = useSWR<TrendResponse>(
    key,
    () => getEcommerceTrend(metric, fiscalYear),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, error: error?.message || null, refetch: mutate }
}
