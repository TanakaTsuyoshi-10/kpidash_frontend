/**
 * 商品別販売状況のデータ取得フック
 */
import { useState, useEffect } from 'react'
import {
  getProductMatrix,
  getProductTrend,
  getProductGroups,
} from '@/lib/api/product'
import type {
  ProductMatrixResponse,
  ProductTrendResponse,
  KPIDefinition,
} from '@/types/product'

export type PeriodType = 'monthly' | 'cumulative'

/**
 * 商品マトリックスを取得するフック
 */
export function useProductMatrix(
  month: string,
  departmentSlug: string = 'store',
  periodType: PeriodType = 'monthly'
) {
  const [data, setData] = useState<ProductMatrixResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getProductMatrix(departmentSlug, month, periodType)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [month, departmentSlug, periodType])

  return { data, loading, error }
}

/**
 * 商品グループ一覧を取得するフック
 */
export function useProductGroups(departmentSlug: string = 'store') {
  const [data, setData] = useState<KPIDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getProductGroups(departmentSlug)
        setData(result ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        setData([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [departmentSlug])

  return { data, loading, error }
}

/**
 * 商品推移データを取得するフック
 */
export function useProductTrend(
  productGroup: string,
  fiscalYear?: number,
  departmentSlug: string = 'store'
) {
  const [data, setData] = useState<ProductTrendResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productGroup) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getProductTrend(departmentSlug, productGroup, fiscalYear)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [productGroup, fiscalYear, departmentSlug])

  return { data, loading, error }
}
