/**
 * 商品別販売状況の型定義
 */

/**
 * 商品値（実績・前年・前年比）
 */
export interface ProductValue {
  actual: number | null
  previous_year: number | null
  two_years_ago?: number | null  // 累計時のみ
  yoy_rate: number | null
  yoy_rate_two_years?: number | null  // 累計時のみ
}

/**
 * 店舗別商品データ
 */
export interface StoreProductData {
  segment_id: string
  segment_code: string
  segment_name: string
  products: Record<string, ProductValue>
  total: number
  total_previous_year?: number | null
  total_two_years_ago?: number | null
}

/**
 * 商品マトリックスレスポンス
 */
export interface ProductMatrixResponse {
  period: string
  period_type: 'monthly' | 'cumulative'
  fiscal_year: number
  product_groups: string[]
  stores: StoreProductData[]
  totals: Record<string, ProductValue>
}

/**
 * 月次値
 */
export interface MonthlyValue {
  month: string
  actual: number | null
  previous_year: number | null
}

/**
 * 店舗別月次データ
 */
export interface StoreMonthlyData {
  segment_id: string
  segment_code: string
  segment_name: string
  data: MonthlyValue[]
  total: number
}

/**
 * 推移サマリー
 */
export interface TrendSummary {
  actual: number[]
  previous_year: number[]
  total: number
  total_previous_year: number
  yoy_rate: number | null
}

/**
 * 商品推移レスポンス
 */
export interface ProductTrendResponse {
  product_group: string
  fiscal_year: number
  months: string[]
  summary: TrendSummary
  stores: StoreMonthlyData[]
}

/**
 * KPI定義
 */
export interface KPIDefinition {
  id: string
  name: string
  unit: string
  category: string
}

/**
 * 通貨フォーマット
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return `¥${value.toLocaleString()}`
}

/**
 * 前年比フォーマット（変化率: 0基準）
 */
export function formatYoY(rate: number | null | undefined): string {
  if (rate == null) return '-'
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

/**
 * 前年比が0以上かどうか
 */
export function isPositiveYoY(rate: number | null | undefined): boolean {
  return rate != null && rate >= 0
}
