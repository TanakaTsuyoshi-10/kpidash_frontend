/**
 * 予想注文（発注バット数予測）の型定義
 */
import type { StoreInfo } from './daily-sales'

// =============================================================================
// バット数
// =============================================================================

export interface StoreBats {
  segment_id: string
  segment_name: string
  bats: number
}

export interface CalendarDay {
  date: string
  weekday: string
  bats: number
  by_store: StoreBats[]
}

export interface CalendarMonth {
  year: number
  month: number
  days: CalendarDay[]
}

// =============================================================================
// 予測
// =============================================================================

export interface ForecastReference {
  year: number
  date: string
  weekday: string
  bats: number
}

export interface ForecastStoreBats {
  segment_id: string
  segment_name: string
  bats: number
  prev_year_bats: number
  two_years_ago_bats: number | null
}

export interface ForecastSummary {
  total_bats: number
  reference_dates: ForecastReference[]
  by_store: ForecastStoreBats[]
}

// =============================================================================
// 商品別パック数
// =============================================================================

export interface ProductRow {
  date?: string
  hour?: number
  weekday?: string
  products: Record<string, number>
  total_bats: number
}

export interface DailyProductBreakdownResponse {
  year: number
  month: number
  product_columns: string[]
  rows: ProductRow[]
}

export interface HourlyProductBreakdownResponse {
  date: string
  weekday: string
  product_columns: string[]
  rows: ProductRow[]
}

// =============================================================================
// レスポンス
// =============================================================================

export interface OrderForecastResponse {
  target_date: string
  target_weekday: string
  stores: StoreInfo[]
  forecast: ForecastSummary
  previous_year: CalendarMonth
  two_years_ago: CalendarMonth
}
