/**
 * 店舗別売上集計データ取得フック（SWR版）
 */
import useSWR from 'swr'

// 店舗別集計データの型
export interface StoreSummaryItem {
  segment_id: string
  segment_code: string
  segment_name: string
  // 売上高
  sales: number | null
  sales_previous_year: number | null
  sales_two_years_ago?: number | null  // 前々年（累計時のみ）
  sales_yoy: number | null  // 前年比（100基準）
  sales_yoy_two_years?: number | null  // 前々年比（累計時のみ）
  // 客数
  customers: number | null
  customers_previous_year: number | null
  customers_two_years_ago?: number | null
  customers_yoy: number | null
  customers_yoy_two_years?: number | null
  // 客単価
  unit_price: number | null
  unit_price_previous_year: number | null
  unit_price_two_years_ago?: number | null
  unit_price_yoy: number | null
  unit_price_yoy_two_years?: number | null
}

// 合計データの型
export interface StoreSummaryTotals {
  sales: number | null
  sales_previous_year: number | null
  sales_two_years_ago?: number | null
  sales_yoy: number | null
  sales_yoy_two_years?: number | null
  customers: number | null
  customers_previous_year: number | null
  customers_two_years_ago?: number | null
  customers_yoy: number | null
  customers_yoy_two_years?: number | null
  unit_price: number | null
  unit_price_previous_year: number | null
  unit_price_two_years_ago?: number | null
  unit_price_yoy: number | null
  unit_price_yoy_two_years?: number | null
}

// APIレスポンスの型
export interface StoreSummaryResponse {
  period: string
  period_type: 'monthly' | 'cumulative'  // 単月 or 累計
  fiscal_year?: number  // 累計時の会計年度
  department_slug: string
  stores: StoreSummaryItem[]
  totals: StoreSummaryTotals
}

export type PeriodType = 'monthly' | 'cumulative'

export function useStoreSummary(
  month: string,
  departmentSlug: string = 'store',
  periodType: PeriodType = 'monthly'
) {
  const params = new URLSearchParams({
    month,
    department_slug: departmentSlug,
    period_type: periodType,
  })
  const key = `/products/store-summary?${params.toString()}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<StoreSummaryResponse>(key, {
    dedupingInterval: 30000,
  })

  return {
    data: data ?? null,
    loading: isLoading,
    validating: isValidating,
    error: error?.message ?? null,
    refetch: mutate,
  }
}
