/**
 * 財務分析API
 */
import { apiClient } from './client'
import type {
  FinancialAnalysisData,
  FinancialUploadResult,
  FinancialQueryParams,
  PLLineItem,
  DepartmentSales,
  ExpenseItem,
  ProfitabilityMetric,
  FinancialAnalysisResponseV2,
  StorePLListResponse,
  StorePL,
} from '@/types/financial'
import type { DashboardResponse, CashFlowData, PeriodType } from '@/types/dashboard'

const API_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * クエリパラメータをURLSearchParamsに変換
 */
function buildQueryParams(params: FinancialQueryParams): string {
  const searchParams = new URLSearchParams()

  if (params.period_type) {
    searchParams.append('period_type', params.period_type)
  }
  if (params.year !== undefined) {
    searchParams.append('year', params.year.toString())
  }
  if (params.month !== undefined) {
    searchParams.append('month', params.month.toString())
  }
  if (params.quarter !== undefined) {
    searchParams.append('quarter', params.quarter.toString())
  }

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * ダッシュボードデータを財務分析用に変換
 */
function transformToFinancialAnalysis(
  dashboard: DashboardResponse,
  periodType: PeriodType
): FinancialAnalysisData {
  const summary = dashboard.company_summary

  // 損益サマリーの行を生成
  const plItems: PLLineItem[] = [
    {
      name: '売上高',
      actual: summary.sales_total.value,
      target: summary.sales_total.target,
      achievement_rate: summary.sales_total.achievement_rate,
      previous_year: summary.sales_total.previous_year,
      yoy_rate: summary.sales_total.yoy_rate,
      yoy_diff: summary.sales_total.yoy_diff,
    },
    {
      name: '売上原価',
      actual: summary.sales_total.value && summary.gross_profit.value
        ? summary.sales_total.value - summary.gross_profit.value
        : null,
      target: null,
      achievement_rate: null,
      previous_year: summary.sales_total.previous_year && summary.gross_profit.previous_year
        ? summary.sales_total.previous_year - summary.gross_profit.previous_year
        : null,
      yoy_rate: null,
      yoy_diff: null,
    },
    {
      name: '売上総利益',
      actual: summary.gross_profit.value,
      target: summary.gross_profit.target,
      achievement_rate: summary.gross_profit.achievement_rate,
      previous_year: summary.gross_profit.previous_year,
      yoy_rate: summary.gross_profit.yoy_rate,
      yoy_diff: summary.gross_profit.yoy_diff,
      is_subtotal: true,
    },
    {
      name: '販管費',
      actual: summary.gross_profit.value && summary.operating_profit.value
        ? summary.gross_profit.value - summary.operating_profit.value
        : null,
      target: null,
      achievement_rate: null,
      previous_year: summary.gross_profit.previous_year && summary.operating_profit.previous_year
        ? summary.gross_profit.previous_year - summary.operating_profit.previous_year
        : null,
      yoy_rate: null,
      yoy_diff: null,
    },
    {
      name: '営業利益',
      actual: summary.operating_profit.value,
      target: summary.operating_profit.target,
      achievement_rate: summary.operating_profit.achievement_rate,
      previous_year: summary.operating_profit.previous_year,
      yoy_rate: summary.operating_profit.yoy_rate,
      yoy_diff: summary.operating_profit.yoy_diff,
      is_subtotal: true,
    },
  ]

  // 部門別売上を生成
  const totalSales = dashboard.department_performance.reduce(
    (sum, d) => sum + (d.sales || 0),
    0
  )
  const departmentSales: DepartmentSales[] = dashboard.department_performance.map((d) => ({
    department: d.department,
    sales: d.sales,
    composition_rate: totalSales > 0 && d.sales ? (d.sales / totalSales) * 100 : null,
    previous_year: null,
    yoy_rate: d.sales_yoy_rate,
    yoy_diff: null,
  }))

  // 経費を生成（販管費の内訳はAPIにないためダミー）
  const sgaExpense = summary.gross_profit.value && summary.operating_profit.value
    ? summary.gross_profit.value - summary.operating_profit.value
    : null
  const expenses: ExpenseItem[] = [
    {
      name: '人件費',
      amount: dashboard.management_indicators.labor_cost_rate.value && summary.sales_total.value
        ? summary.sales_total.value * (dashboard.management_indicators.labor_cost_rate.value / 100)
        : null,
      rate: dashboard.management_indicators.labor_cost_rate.value,
    },
    {
      name: '販管費計',
      amount: sgaExpense,
      rate: summary.sales_total.value && sgaExpense
        ? (sgaExpense / summary.sales_total.value) * 100
        : null,
    },
  ]

  // 収益性指標を生成
  const profitability: ProfitabilityMetric[] = [
    {
      name: '粗利率',
      value: summary.gross_profit_rate.value,
      previous_year: summary.gross_profit_rate.previous_year,
      diff: summary.gross_profit_rate.yoy_diff,
      invert_color: false,
    },
    {
      name: '営業利益率',
      value: summary.sales_total.value && summary.operating_profit.value
        ? (summary.operating_profit.value / summary.sales_total.value) * 100
        : null,
      previous_year: summary.sales_total.previous_year && summary.operating_profit.previous_year
        ? (summary.operating_profit.previous_year / summary.sales_total.previous_year) * 100
        : null,
      diff: null,
      invert_color: false,
    },
    {
      name: '原価率',
      value: dashboard.management_indicators.cost_rate.value,
      previous_year: dashboard.management_indicators.cost_rate.previous_year,
      diff: dashboard.management_indicators.cost_rate.yoy_diff,
      invert_color: true,
    },
    {
      name: '人件費率',
      value: dashboard.management_indicators.labor_cost_rate.value,
      previous_year: dashboard.management_indicators.labor_cost_rate.previous_year,
      diff: dashboard.management_indicators.labor_cost_rate.yoy_diff,
      invert_color: true,
    },
  ]

  // 営業利益率の差分を計算
  if (profitability[1].value !== null && profitability[1].previous_year !== null) {
    profitability[1].diff = profitability[1].value - profitability[1].previous_year
  }

  return {
    period: summary.period,
    period_type: summary.period_type,
    fiscal_year: summary.fiscal_year,
    pl_summary: {
      period: summary.period,
      items: plItems,
    },
    department_sales: departmentSales,
    expenses,
    profitability,
    cash_flow: dashboard.cash_flow,
  }
}

/**
 * 財務分析データ取得
 */
export async function getFinancialAnalysis(
  params: FinancialQueryParams = {}
): Promise<FinancialAnalysisData> {
  const query = buildQueryParams(params)
  const dashboard = await apiClient.get<DashboardResponse>(`/api/v1/dashboard${query}`)
  return transformToFinancialAnalysis(dashboard, params.period_type || 'monthly')
}

/**
 * キャッシュフローデータを取得
 */
export async function getFinancialCashFlow(
  params: FinancialQueryParams = {}
): Promise<CashFlowData> {
  const query = buildQueryParams(params)
  return apiClient.get<CashFlowData>(`/api/v1/dashboard/cashflow${query}`)
}

/**
 * 財務データアップロード
 */
export async function uploadFinancialData(file: File): Promise<FinancialUploadResult> {
  return apiClient.uploadFile<FinancialUploadResult>('/upload/financial', file)
}

/**
 * 店舗別収支データアップロード
 */
export async function uploadStorePLData(file: File): Promise<FinancialUploadResult> {
  return apiClient.uploadFile<FinancialUploadResult>('/upload/store-pl', file)
}

/**
 * 財務データテンプレートダウンロードURL取得
 */
export function getFinancialTemplateUrl(year: number, month: number): string {
  return `${API_URL}/api/v1/templates/financial?year=${year}&month=${month}`
}

/**
 * 店舗別収支テンプレートダウンロードURL取得
 */
export function getStorePLTemplateUrl(year: number, month: number): string {
  return `${API_URL}/api/v1/templates/store-pl?year=${year}&month=${month}`
}

// =============================================================================
// 財務分析V2 API（展開可能な明細対応）
// =============================================================================

/**
 * 財務分析データ取得（新API - 明細展開対応）
 * GET /api/v1/finance/analysis
 */
export async function getFinanceAnalysisV2(
  month: string,
  periodType: 'monthly' | 'cumulative'
): Promise<FinancialAnalysisResponseV2> {
  const searchParams = new URLSearchParams({
    month,
    period_type: periodType,
  })
  return apiClient.get<FinancialAnalysisResponseV2>(
    `/api/v1/finance/analysis?${searchParams.toString()}`
  )
}

/**
 * 店舗別収支一覧取得
 * GET /api/v1/finance/store-pl
 */
export async function getStorePLList(
  month: string,
  departmentSlug: string = 'store',
  periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
): Promise<StorePLListResponse> {
  const searchParams = new URLSearchParams({
    month,
    department_slug: departmentSlug,
    period_type: periodType,
  })
  return apiClient.get<StorePLListResponse>(
    `/api/v1/finance/store-pl?${searchParams.toString()}`
  )
}

/**
 * 特定店舗の収支取得
 * GET /api/v1/finance/store-pl/{segment_id}
 */
export async function getStorePLBySegment(
  segmentId: string,
  month: string
): Promise<StorePL> {
  const searchParams = new URLSearchParams({ month })
  return apiClient.get<StorePL>(
    `/api/v1/finance/store-pl/${segmentId}?${searchParams.toString()}`
  )
}
