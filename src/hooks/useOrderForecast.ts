/**
 * 予想注文データ取得フック
 */
import { useState, useEffect } from 'react'
import { getOrderForecast } from '@/lib/api/order-forecast'
import type { OrderForecastResponse } from '@/types/order-forecast'

/**
 * 予想注文データを取得するフック
 */
export function useOrderForecast(
  targetDate: string,
  segmentId?: string,
  departmentSlug: string = 'store',
) {
  const [data, setData] = useState<OrderForecastResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!targetDate) {
      setLoading(false)
      return
    }
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getOrderForecast(targetDate, segmentId, departmentSlug)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [targetDate, segmentId, departmentSlug])

  return { data, loading, error }
}
