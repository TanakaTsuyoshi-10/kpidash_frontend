/**
 * 製造分析関連の型定義
 */
import type { PeriodType } from './dashboard'

// 日次データ
export interface ManufacturingDailyData {
  date: string
  production_batts: number | null
  production_pieces: number | null
  workers_count: number | null
  production_per_worker: number | null
  paid_leave_hours: number | null
}

// 月次サマリー
export interface ManufacturingMonthlySummary {
  month: string
  total_batts: number | null
  total_pieces: number | null
  total_workers: number | null
  avg_production_per_worker: number | null
  total_paid_leave_hours: number | null
  working_days: number | null
}

// 前年比較
export interface ManufacturingComparison {
  period: string
  current: ManufacturingMonthlySummary | null
  previous_year: ManufacturingMonthlySummary | null
  previous_year2: ManufacturingMonthlySummary | null
  yoy_batts_diff: number | null
  yoy_batts_rate: number | null
  yoy_workers_diff: number | null
  yoy_workers_rate: number | null
  yoy_productivity_diff: number | null
  yoy_productivity_rate: number | null
  yoy_leave_diff: number | null
  yoy_leave_rate: number | null
}

// グラフデータ
export interface ManufacturingChartData {
  month: string
  total_batts: number | null
  avg_production_per_worker: number | null
  total_workers: number | null
}

// 製造分析レスポンス
export interface ManufacturingAnalysisResponse {
  period: string
  period_type: PeriodType
  fiscal_year: number
  summary: ManufacturingMonthlySummary | null
  daily_data: ManufacturingDailyData[]
  comparison: ManufacturingComparison | null
  chart_data: ManufacturingChartData[]
}

// アップロード結果
export interface ManufacturingUploadResult {
  success: boolean
  message: string
  month: string
  imported_count: number
  summary: {
    total_batts: number
    total_pieces: number
    avg_production_per_worker: number
    working_days: number
  } | null
  warnings: string[]
}

// クエリパラメータ
export interface ManufacturingQueryParams {
  period_type?: PeriodType
  year?: number
  month?: number
  quarter?: number
}
