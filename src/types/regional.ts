/**
 * 地区別分析の型定義
 */

// 地区
export interface Region {
  id: string
  name: string
  display_order: number
}

// 地区一覧レスポンス
export interface RegionsResponse {
  regions: Region[]
}

// 店舗-地区マッピング
export interface StoreMapping {
  segment_id: string
  segment_name: string
  region_id: string
  region_name: string
}

// マッピング一覧レスポンス
export interface StoreMappingsResponse {
  mappings: StoreMapping[]
}

// 店舗データ
export interface RegionalStoreData {
  segment_id: string
  segment_name: string
  sales: number | null
  sales_previous_year: number | null
  sales_yoy_rate: number | null
  customers: number | null
  customers_previous_year: number | null
  customers_yoy_rate: number | null
  unit_price: number | null
  unit_price_previous_year: number | null
}

// 地区データ
export interface RegionalData {
  region_id: string
  region_name: string
  total_sales: number | null
  total_sales_previous_year: number | null
  sales_yoy_rate: number | null
  sales_yoy_diff: number | null
  target_sales: number | null
  target_diff: number | null
  target_achievement_rate: number | null
  total_customers: number | null
  total_customers_previous_year: number | null
  customers_yoy_rate: number | null
  target_customers: number | null
  avg_unit_price: number | null
  avg_unit_price_previous_year: number | null
  stores: RegionalStoreData[]
  products: unknown[]
}

// 全体合計
export interface GrandTotal {
  total_sales: number | null
  total_sales_previous_year: number | null
  sales_yoy_rate: number | null
  total_customers: number | null
  total_customers_previous_year: number | null
  customers_yoy_rate: number | null
  avg_unit_price: number | null
}

// 地区別集計レスポンス
export interface RegionalSummaryResponse {
  period: string
  period_type: 'monthly' | 'cumulative'
  fiscal_year: number | null
  regions: RegionalData[]
  grand_total: GrandTotal
}

// 地区別目標
export interface RegionalTarget {
  region_id: string
  region_name: string
  month: string
  target_sales: number | null
  target_customers: number | null
}

// 地区別目標一覧レスポンス
export interface RegionalTargetsResponse {
  month: string
  targets: RegionalTarget[]
}

// 地区別目標保存リクエスト
export interface SaveRegionalTargetRequest {
  region_id: string
  month: string
  target_sales: number | null
  target_customers: number | null
}

export interface SaveRegionalTargetsRequest {
  targets: SaveRegionalTargetRequest[]
}

// 期間タイプ
export type PeriodType = 'monthly' | 'cumulative'
