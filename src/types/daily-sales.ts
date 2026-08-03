/**
 * 日次販売分析の型定義
 */

// =============================================================================
// 共通
// =============================================================================

export interface StoreInfo {
  segment_id: string
  segment_code: string
  segment_name: string
}

// =============================================================================
// API 1: 日別×店舗サマリー
// =============================================================================

export interface DailyStoreSalesData {
  date: string
  comparison_date?: string | null
  segment_id: string
  sales: number
  customers: number
  unit_price: number
  sales_previous_year: number | null
  customers_previous_year: number | null
  yoy_sales_rate: number | null
  yoy_customers_rate: number | null
}

export interface DailySalesSummaryResponse {
  period: string
  dates: string[]
  stores: StoreInfo[]
  data: DailyStoreSalesData[]
  totals: DailyStoreSalesData[]
}

// =============================================================================
// API 2: 時間帯別ヒートマップ
// =============================================================================

export interface HourlySalesData {
  hour: number
  segment_id: string
  sales: number
  customers: number
}

export interface HourlySalesTotals {
  segment_id?: string
  hour?: number
  sales: number
  customers: number
}

export interface HourlySalesResponse {
  date: string
  hours: number[]
  stores: StoreInfo[]
  data: HourlySalesData[]
  row_totals: HourlySalesTotals[]
  col_totals: HourlySalesTotals[]
}

// =============================================================================
// API 3: 日次推移グラフ
// =============================================================================

export interface DailyTrendDataPoint {
  date: string
  sales: number
  customers: number
}

export interface DailyTrendResponse {
  period: string
  segment_id: string | null
  segment_name: string | null
  current_year: DailyTrendDataPoint[]
  previous_year: DailyTrendDataPoint[]
}

// =============================================================================
// アップロード
// =============================================================================

export interface ReceiptJournalUploadResult {
  success: boolean
  start_date: string | null
  end_date: string | null
  imported_count: number
  stores_processed: string[]
  errors: string[]
  warnings: string[]
}

// =============================================================================
// メトリクス切替用
// =============================================================================

export type DailySalesMetric = 'sales' | 'customers' | 'unit_price'

// =============================================================================
// 曜日別分析（平日 / 土日祝）
// =============================================================================

export interface WeekdayGroupPrev {
  days: number
  avg_sales: number
  avg_bats: number
  avg_customers: number
  avg_price: number
}

export interface WeekdayGroupYoy {
  avg_sales: number | null
  avg_bats: number | null
  avg_customers: number | null
  avg_price: number | null
}

export interface WeekdayGroupStats extends WeekdayGroupPrev {
  prev: WeekdayGroupPrev
  yoy: WeekdayGroupYoy
}

export interface WeekdayAnalysisResponse {
  period: string
  weekday: WeekdayGroupStats
  weekend: WeekdayGroupStats
}

// 店舗の日別×時間帯 来客ヒートマップ
export interface DailyHourlyCustomerCell {
  date: string
  hour: number
  customers: number
}

export interface StoreHourlyCustomersResponse {
  period: string
  segment_id: string
  hours: number[]
  dates: string[]
  data: DailyHourlyCustomerCell[]
  row_totals: { date: string; customers: number }[]
  col_totals: { hour: number; customers: number }[]
  total: number
}
