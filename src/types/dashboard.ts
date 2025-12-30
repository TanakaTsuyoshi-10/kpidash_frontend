/**
 * 経営ダッシュボード型定義
 */

// 単一指標と比較値を持つモデル
export interface MetricWithComparison {
  value: number | null
  previous_year: number | null
  yoy_rate: number | null
  yoy_diff: number | null
  target: number | null
  achievement_rate: number | null
}

// 全社サマリー
export interface CompanySummary {
  period: string
  period_type: 'monthly' | 'quarterly' | 'yearly'
  fiscal_year: number
  sales_total: MetricWithComparison
  gross_profit: MetricWithComparison
  gross_profit_rate: MetricWithComparison
  operating_profit: MetricWithComparison
}

// 部門別実績
export interface DepartmentPerformance {
  department: string
  sales: number | null
  sales_yoy_rate: number | null
  profit: number | null
  achievement_rate: number | null
  budget_rate: number | null
}

// キャッシュフローデータ
export interface CashFlowData {
  cf_operating: number | null
  cf_operating_prev: number | null
  cf_operating_prev2: number | null
  cf_investing: number | null
  cf_investing_prev: number | null
  cf_investing_prev2: number | null
  cf_financing: number | null
  cf_financing_prev: number | null
  cf_financing_prev2: number | null
  cf_free: number | null
  cf_free_prev: number | null
  cf_free_prev2: number | null
}

// 経営指標
export interface ManagementIndicators {
  cost_rate: MetricWithComparison
  labor_cost_rate: MetricWithComparison
  customer_count: MetricWithComparison
  customer_unit_price: MetricWithComparison
}

// グラフ用データポイント
export interface ChartDataPoint {
  month: string
  sales: number | null
  operating_profit: number | null
  sales_target: number | null
  operating_profit_target: number | null
}

// アラート項目
export interface DashboardAlertItem {
  category: string
  name: string
  achievement_rate: number
  actual: number
  target: number
  severity: 'warning' | 'critical'
}

// クレームサマリー
export interface ComplaintSummary {
  current_month_count: number
  previous_month_count: number
  yoy_rate?: number | null
  in_progress_count: number
}

// ダッシュボード全体レスポンス
export interface DashboardResponse {
  company_summary: CompanySummary
  department_performance: DepartmentPerformance[]
  cash_flow: CashFlowData
  management_indicators: ManagementIndicators
  chart_data: ChartDataPoint[]
  alerts: DashboardAlertItem[]
  complaint_summary?: ComplaintSummary
}

// クエリパラメータ
export interface DashboardQueryParams {
  period_type?: 'monthly' | 'quarterly' | 'yearly'
  year?: number
  month?: number
  quarter?: number
}

// 期間タイプ
export type PeriodType = 'monthly' | 'quarterly' | 'yearly'
