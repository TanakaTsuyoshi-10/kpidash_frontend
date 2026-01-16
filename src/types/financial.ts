/**
 * 財務分析関連の型定義
 */
import type { CashFlowData, PeriodType } from './dashboard'

// 損益計算書の行
export interface PLLineItem {
  name: string
  actual: number | null
  target: number | null
  achievement_rate: number | null
  previous_year: number | null
  yoy_rate: number | null
  yoy_diff: number | null
  is_subtotal?: boolean
}

// 損益サマリー
export interface PLSummary {
  period: string
  items: PLLineItem[]
}

// 部門別売上
export interface DepartmentSales {
  department: string
  sales: number | null
  composition_rate: number | null
  previous_year: number | null
  yoy_rate: number | null
  yoy_diff: number | null
}

// 経費項目
export interface ExpenseItem {
  name: string
  amount: number | null
  rate: number | null
}

// 収益性指標
export interface ProfitabilityMetric {
  name: string
  value: number | null
  previous_year: number | null
  diff: number | null
  invert_color?: boolean
}

// 財務分析レスポンス
export interface FinancialAnalysisData {
  period: string
  period_type: PeriodType
  fiscal_year: number
  pl_summary: PLSummary
  department_sales: DepartmentSales[]
  expenses: ExpenseItem[]
  profitability: ProfitabilityMetric[]
  cash_flow: CashFlowData
}

// アップロード結果
export interface FinancialUploadResult {
  success: boolean
  message: string
  month: string
  data_type: string
  action: string
  warnings: string[]
}

// クエリパラメータ
export interface FinancialQueryParams {
  period_type?: PeriodType
  year?: number
  month?: number
  quarter?: number
}

// =============================================================================
// 財務分析V2 - 展開可能な明細対応
// =============================================================================

// 売上原価明細
export interface CostOfSalesDetail {
  purchases: number           // 仕入高
  raw_material_purchases: number  // 原材料仕入高
  labor_cost: number          // 労務費
  consumables: number         // 消耗品費
  rent: number                // 賃借料
  repairs: number             // 修繕費
  utilities: number           // 水道光熱費
  others: number              // その他
  total: number
}

// 販管費明細
export interface SGADetail {
  executive_compensation: number  // 役員報酬
  personnel_cost: number          // 人件費
  delivery_cost: number           // 配送費
  packaging_cost: number          // 包装費
  payment_fees: number            // 支払手数料
  freight_cost: number            // 荷造運賃費
  sales_commission: number        // 販売手数料
  advertising_cost: number        // 広告宣伝費
  others: number                  // その他
  total: number
}

// 財務サマリー（展開対応）
export interface FinancialSummaryWithDetails {
  period: string
  sales_total: number | null
  cost_of_sales: number | null
  cost_of_sales_detail: CostOfSalesDetail | null
  gross_profit: number | null
  sga_total: number | null
  sga_detail: SGADetail | null
  operating_profit: number | null
}

// 新APIレスポンス
export interface FinancialAnalysisResponseV2 {
  period: string
  period_type: 'monthly' | 'cumulative'
  current: FinancialSummaryWithDetails
  previous_year: FinancialSummaryWithDetails | null
  target: FinancialSummaryWithDetails | null           // 目標データ
  sales_yoy_rate: number | null
  gross_profit_yoy_rate: number | null
  operating_profit_yoy_rate: number | null
  sales_achievement_rate: number | null                // 売上高達成率
  gross_profit_achievement_rate: number | null         // 売上総利益達成率
  operating_profit_achievement_rate: number | null     // 営業利益達成率
}

// =============================================================================
// 店舗別収支
// =============================================================================

// 店舗別販管費明細
export interface StorePLSGADetail {
  personnel_cost: number      // 人件費
  land_rent: number           // 地代家賃
  lease_cost: number          // 賃借料
  utilities: number           // 水道光熱費
  others: number              // その他
}

// 店舗別売上原価明細
export interface StorePLCostDetail {
  purchases: number           // 仕入高
  labor_cost: number          // 労務費
  manufacturing_cost: number  // 製造経費
  others: number              // その他
}

// 店舗別収支
export interface StorePL {
  store_id: string
  store_code: string | null
  store_name: string
  period: string
  sales: number
  cost_of_sales: number
  gross_profit: number
  sga_total: number
  operating_profit: number
  sga_detail: StorePLSGADetail | null
  cost_detail: StorePLCostDetail | null  // 売上原価明細
  // 目標値
  sales_target: number | null
  operating_profit_target: number | null
  // 前年実績
  sales_prev_year: number | null
  cost_of_sales_prev_year: number | null
  gross_profit_prev_year: number | null
  sga_prev_year: number | null
  operating_profit_prev_year: number | null
  // 前年比
  sales_yoy_rate: number | null
  operating_profit_yoy_rate: number | null
  // 達成率
  sales_achievement_rate: number | null
  operating_profit_achievement_rate: number | null
}

// 店舗別収支一覧レスポンス
export interface StorePLListResponse {
  period: string
  stores: StorePL[]
  total_sales: number
  total_cost_of_sales: number
  total_gross_profit: number
  total_sga: number
  total_operating_profit: number
  // 期間情報（集計時に使用）
  period_type?: 'monthly' | 'quarterly' | 'yearly'
  start_period?: string
  end_period?: string
}
