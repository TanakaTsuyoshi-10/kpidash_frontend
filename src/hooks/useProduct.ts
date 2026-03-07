/**
 * 商品別販売状況のデータ取得フック（SWR版）
 */
'use client'

import useSWR from 'swr'
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
  const key = `/products/matrix?month=${month}&dept=${departmentSlug}&period=${periodType}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<ProductMatrixResponse>(
    key,
    () => getProductMatrix(departmentSlug, month, periodType),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 商品グループ一覧を取得するフック
 */
export function useProductGroups(departmentSlug: string = 'store') {
  const key = `/products/groups?dept=${departmentSlug}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<KPIDefinition[]>(
    key,
    () => getProductGroups(departmentSlug),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? [], loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 商品推移データを取得するフック
 */
export function useProductTrend(
  productGroup: string,
  fiscalYear?: number,
  departmentSlug: string = 'store'
) {
  const key = productGroup
    ? `/products/trend?group=${productGroup}&fy=${fiscalYear ?? ''}&dept=${departmentSlug}`
    : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<ProductTrendResponse>(
    key,
    () => getProductTrend(departmentSlug, productGroup, fiscalYear),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}
