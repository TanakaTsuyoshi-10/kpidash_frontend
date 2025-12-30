/**
 * 通販分析のデータ取得フック
 */
import { useState, useEffect, useCallback } from 'react'
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
  const [data, setData] = useState<ChannelSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getChannelSummary(month, periodType)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [month, periodType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * 商品別実績を取得するフック
 */
export function useProductSummary(
  month: string,
  periodType: PeriodType = 'monthly',
  limit: number = 20
) {
  const [data, setData] = useState<ProductSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getProductSummary(month, periodType, limit)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [month, periodType, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * 顧客別実績を取得するフック
 */
export function useCustomerSummary(month: string, periodType: PeriodType = 'monthly') {
  const [data, setData] = useState<CustomerSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getCustomerSummary(month, periodType)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [month, periodType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * HPアクセス数を取得するフック
 */
export function useWebsiteStats(month: string, periodType: PeriodType = 'monthly') {
  const [data, setData] = useState<WebsiteStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getWebsiteStats(month, periodType)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [month, periodType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * 推移データを取得するフック
 */
export function useEcommerceTrend(
  metric: 'channel_sales' | 'product_sales' | 'customers' | 'website',
  fiscalYear?: number
) {
  const [data, setData] = useState<TrendResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getEcommerceTrend(metric, fiscalYear)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [metric, fiscalYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
