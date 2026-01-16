/**
 * 通販分析の型定義
 */

// チャネル別実績
export interface ChannelData {
  channel: string  // "EC", "電話", "FAX", "店舗受付"
  sales: number | null
  sales_target: number | null              // 売上高目標
  sales_achievement_rate: number | null    // 売上高達成率（%）
  sales_previous_year: number | null
  sales_two_years_ago: number | null
  sales_yoy: number | null
  sales_yoy_two_years: number | null
  buyers: number | null
  buyers_target: number | null             // 購入者数目標
  buyers_achievement_rate: number | null   // 購入者数達成率（%）
  buyers_previous_year: number | null
  buyers_two_years_ago: number | null
  buyers_yoy: number | null
  buyers_yoy_two_years: number | null
  unit_price: number | null
  unit_price_previous_year: number | null
  unit_price_two_years_ago: number | null
  unit_price_yoy: number | null
  unit_price_yoy_two_years: number | null
}

export interface ChannelTotals {
  sales: number | null
  sales_target: number | null              // 売上高目標
  sales_achievement_rate: number | null    // 売上高達成率（%）
  sales_previous_year: number | null
  sales_two_years_ago: number | null
  sales_yoy: number | null
  sales_yoy_two_years: number | null
  buyers: number | null
  buyers_target: number | null             // 購入者数目標
  buyers_achievement_rate: number | null   // 購入者数達成率（%）
  buyers_previous_year: number | null
  buyers_two_years_ago: number | null
  buyers_yoy: number | null
  buyers_yoy_two_years: number | null
  unit_price: number | null
  unit_price_previous_year: number | null
  unit_price_two_years_ago: number | null
  unit_price_yoy: number | null
  unit_price_yoy_two_years: number | null
}

export interface ChannelSummaryResponse {
  period: string
  period_type: 'monthly' | 'cumulative'
  fiscal_year: number | null
  channels: ChannelData[]
  totals: ChannelTotals
}

// 商品別実績
export interface ProductData {
  product_name: string
  product_category: string | null
  sales: number | null
  sales_previous_year: number | null
  sales_two_years_ago: number | null
  sales_yoy: number | null
  sales_yoy_two_years: number | null
  quantity: number | null
  quantity_previous_year: number | null
  quantity_two_years_ago: number | null
}

export interface ProductSummaryResponse {
  period: string
  period_type: 'monthly' | 'cumulative'
  fiscal_year: number | null
  products: ProductData[]
  total_sales: number | null
  total_sales_previous_year: number | null
  total_sales_two_years_ago: number | null
}

// 顧客別実績
export interface CustomerStatsData {
  new_customers: number | null
  new_customers_target: number | null              // 新規顧客数目標
  new_customers_achievement_rate: number | null    // 新規顧客数達成率（%）
  new_customers_previous_year: number | null
  new_customers_two_years_ago: number | null
  new_customers_yoy: number | null
  new_customers_yoy_two_years: number | null
  repeat_customers: number | null
  repeat_customers_target: number | null           // リピーター数目標
  repeat_customers_achievement_rate: number | null // リピーター数達成率（%）
  repeat_customers_previous_year: number | null
  repeat_customers_two_years_ago: number | null
  repeat_customers_yoy: number | null
  repeat_customers_yoy_two_years: number | null
  total_customers: number | null
  total_customers_target: number | null            // 合計顧客数目標
  total_customers_achievement_rate: number | null  // 合計顧客数達成率（%）
  total_customers_previous_year: number | null
  total_customers_two_years_ago: number | null
  repeat_rate: number | null
  repeat_rate_previous_year: number | null
}

export interface CustomerSummaryResponse {
  period: string
  period_type: 'monthly' | 'cumulative'
  fiscal_year: number | null
  data: CustomerStatsData
}

// HPアクセス数
export interface WebsiteStatsData {
  page_views: number | null
  page_views_previous_year: number | null
  page_views_two_years_ago: number | null
  page_views_yoy: number | null
  page_views_yoy_two_years: number | null
  unique_visitors: number | null
  unique_visitors_previous_year: number | null
  unique_visitors_two_years_ago: number | null
  unique_visitors_yoy: number | null
  unique_visitors_yoy_two_years: number | null
  sessions: number | null
  sessions_previous_year: number | null
  sessions_two_years_ago: number | null
  sessions_yoy: number | null
  sessions_yoy_two_years: number | null
}

export interface WebsiteStatsResponse {
  period: string
  period_type: 'monthly' | 'cumulative'
  fiscal_year: number | null
  data: WebsiteStatsData
}

// 推移データ
export interface TrendDataItem {
  name: string
  values: (number | null)[]
}

export interface TrendResponse {
  fiscal_year: number
  metric: string
  months: string[]
  data: TrendDataItem[]
}

// アップロードレスポンス
export interface EcommerceBulkUploadResponse {
  success: boolean
  message: string
  month: string
  channel_records: number
  product_records: number
  customer_records: number
  website_records: number
}

// 期間タイプ
export type PeriodType = 'monthly' | 'cumulative'

// フォーマット関数
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return `¥${value.toLocaleString()}`
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-'
  return value.toLocaleString()
}

export function formatYoY(rate: number | null | undefined): string {
  if (rate == null) return '-'
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '-'
  return `${value.toFixed(1)}%`
}

export function isPositiveYoY(rate: number | null | undefined): boolean {
  return rate != null && rate >= 0
}

// 達成率の色クラスを取得
export function getAchievementRateColor(rate: number | null | undefined): string {
  if (rate == null) return 'text-gray-400'
  if (rate >= 100) return 'text-green-600'
  if (rate >= 80) return 'text-orange-600'
  return 'text-red-600'
}

// 達成率をフォーマット
export function formatAchievementRate(rate: number | null | undefined): string {
  if (rate == null) return '-'
  return `${rate.toFixed(1)}%`
}
