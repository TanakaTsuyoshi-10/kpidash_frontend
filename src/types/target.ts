/**
 * 目標値管理の型定義
 */

/**
 * マトリックスKPI定義
 */
export interface TargetMatrixKpi {
  id: string
  name: string
  unit: string
}

/**
 * マトリックスセル値
 */
export interface TargetMatrixCell {
  target_id: number | null
  value: number | null
  last_year_actual: number | null  // 前年同月実績
}

/**
 * マトリックス行（店舗）
 */
export interface TargetMatrixRow {
  segment_id: string
  segment_code: string
  segment_name: string
  values: Record<string, TargetMatrixCell>
}

/**
 * マトリックスレスポンス
 */
export interface TargetMatrixResponse {
  fiscal_year: number
  month: string
  kpis: TargetMatrixKpi[]
  rows: TargetMatrixRow[]
}

/**
 * 目標値作成リクエスト
 */
export interface TargetValueCreate {
  segment_id: string
  kpi_id: string
  month: string
  value: number
}

/**
 * 目標値更新リクエスト
 */
export interface TargetValueUpdate {
  value: number
}

/**
 * 一括登録リクエスト
 */
export interface TargetBulkRequest {
  targets: TargetValueCreate[]
}

/**
 * 一括登録レスポンス
 */
export interface TargetBulkResponse {
  success: boolean
  created_count: number
  updated_count: number
  errors: string[]
}

/**
 * 目標値レスポンス
 */
export interface TargetValueResponse {
  id: number
  segment_id: string
  segment_name: string | null
  kpi_id: string
  kpi_name: string | null
  month: string
  value: number
}

/**
 * セル変更データ
 */
export interface CellChange {
  segmentId: string
  kpiId: string
  targetId: number | null
  value: number | null
  originalValue: number | null
}

/**
 * 数値フォーマット（カンマ区切り、小数点なし）
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return ''
  return Math.round(value).toLocaleString('ja-JP')
}

/**
 * 入力値パース（カンマ除去）
 */
export function parseInputValue(value: string): number | null {
  if (value === '' || value === '-') return null
  const num = parseFloat(value.replace(/,/g, ''))
  if (isNaN(num) || num < 0) {
    throw new Error('0以上の数値を入力してください')
  }
  return num
}

/**
 * 年度内の月リスト生成（9月〜翌8月）
 * 例: fiscalYear=2025 → 2024/9〜2025/8
 */
export function generateMonthOptions(fiscalYear: number): { value: string; label: string }[] {
  const months = []
  // 年度の開始カレンダー年（年度-1）
  const startYear = fiscalYear - 1

  for (let i = 0; i < 12; i++) {
    // 9月から開始: 9,10,11,12,1,2,3,4,5,6,7,8
    const monthNum = ((8 + i) % 12) + 1
    // 9-12月は開始年、1-8月は翌年
    const year = monthNum >= 9 ? startYear : startYear + 1
    months.push({
      value: `${year}-${String(monthNum).padStart(2, '0')}-01`,
      label: `${year}年${monthNum}月`,
    })
  }
  return months
}

/**
 * 現在の会計年度を取得
 * 例: 2024年9月〜2025年8月 → 2025年度
 */
export function getCurrentFiscalYear(): number {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  // 9月以降は翌年度、1-8月は当年が会計年度
  return month >= 9 ? year + 1 : year
}

/**
 * 現在の月を取得（YYYY-MM-01形式）
 */
export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

// =============================================================================
// 目標設定概要
// =============================================================================

/**
 * 目標概要レスポンス
 */
export interface TargetOverview {
  fiscal_year: number
  month: string
  departments: DepartmentTargetSummary[]
}

/**
 * 部門別目標サマリー
 */
export interface DepartmentTargetSummary {
  department_type: 'store' | 'ecommerce' | 'financial'
  department_name: string
  has_targets: boolean
  target_count: number
  last_updated: string | null
}

// =============================================================================
// 店舗目標（既存を拡張）
// =============================================================================

/**
 * 店舗目標値（前年比付き）
 */
export interface StoreTargetValue {
  kpi_id: string
  target_id: string | null
  value: number | null
  last_year_actual: number | null
  yoy_rate: number | null
}

/**
 * 店舗目標一括保存リクエスト
 */
export interface StoreTargetBulkInput {
  month: string
  targets: Array<{
    segment_id: string
    kpi_id: string
    value: number
  }>
}

// =============================================================================
// 財務目標
// =============================================================================

/**
 * 財務目標レスポンス
 */
export interface FinancialTargetResponse {
  fiscal_year: number
  month: string
  summary_items: FinancialTargetItem[]
  cost_items: FinancialTargetItem[]
  sga_items: FinancialTargetItem[]
}

/**
 * 財務目標項目
 */
export interface FinancialTargetItem {
  field_name: string
  display_name: string
  target_value: number | null
  last_year_actual: number | null
  sales_ratio: number | null
  yoy_rate: number | null
  is_calculated?: boolean
}

/**
 * 財務目標保存リクエスト
 */
export interface FinancialTargetInput {
  month: string
  summary?: {
    sales_total?: number | null
    sales_store?: number | null
    sales_online?: number | null
    cost_of_sales?: number | null
    gross_profit?: number | null
    sga_total?: number | null
    operating_profit?: number | null
  }
  cost_details?: {
    purchases?: number | null
    raw_material_purchases?: number | null
    labor_cost?: number | null
    consumables?: number | null
    rent?: number | null
    repairs?: number | null
    utilities?: number | null
  }
  sga_details?: {
    executive_compensation?: number | null
    personnel_cost?: number | null
    delivery_cost?: number | null
    packaging_cost?: number | null
    payment_fees?: number | null
    freight_cost?: number | null
    sales_commission?: number | null
    advertising_cost?: number | null
  }
}

// =============================================================================
// 通販目標
// =============================================================================

/**
 * 通販目標レスポンス
 */
export interface EcommerceTargetResponse {
  fiscal_year: number
  month: string
  total_target_sales: number | null
  last_year_total_sales: number | null
  yoy_total_rate: number | null
  channel_targets: EcommerceChannelTarget[]
  customer_target: EcommerceCustomerTarget | null
}

/**
 * 通販チャネル目標
 */
export interface EcommerceChannelTarget {
  channel: string
  target_sales: number | null
  target_buyers: number | null
  last_year_sales: number | null
  last_year_buyers: number | null
  yoy_sales_rate: number | null
  yoy_buyers_rate: number | null
}

/**
 * 顧客統計目標
 */
export interface EcommerceCustomerTarget {
  new_customers: number | null
  repeat_customers: number | null
  last_year_new: number | null
  last_year_repeat: number | null
  yoy_new_rate: number | null
  yoy_repeat_rate: number | null
}

/**
 * 通販目標保存リクエスト
 */
export interface EcommerceTargetInput {
  month: string
  channel_targets?: Array<{
    channel: string
    sales?: number | null
    buyers?: number | null
  }>
  new_customers?: number | null
  repeat_customers?: number | null
}

// =============================================================================
// 保存結果
// =============================================================================

/**
 * 目標設定保存結果
 */
export interface TargetSettingResult {
  created_count: number
  updated_count: number
  errors: string[]
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * 前年比フォーマット
 */
export function formatYoY(rate: number | null): string {
  if (rate === null) return '-'
  const sign = rate > 0 ? '+' : rate < 0 ? '' : '±'
  return `${sign}${rate.toFixed(1)}%`
}

/**
 * 前年比カラー取得
 */
export function getYoYColor(rate: number | null): string {
  if (rate === null) return 'text-gray-400'
  if (rate > 0) return 'text-green-600'
  if (rate < 0) return 'text-red-600'
  return 'text-gray-500'
}

/**
 * 前年比計算
 */
export function calculateYoY(target: number | null, lastYear: number | null): number | null {
  if (target === null || lastYear === null || lastYear === 0) return null
  return ((target - lastYear) / lastYear) * 100
}

/**
 * 売上対比計算
 */
export function calculateSalesRatio(value: number | null, salesTotal: number | null): number | null {
  if (value === null || salesTotal === null || salesTotal === 0) return null
  return (value / salesTotal) * 100
}
