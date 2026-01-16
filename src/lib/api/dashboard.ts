/**
 * 経営ダッシュボードAPI
 */
import { apiClient } from './client'
import type {
  DashboardResponse,
  CompanySummary,
  CashFlowData,
  ChartDataPoint,
  DashboardAlertItem,
  DashboardQueryParams,
} from '@/types/dashboard'

const BASE_PATH = '/api/v1/dashboard'

/**
 * クエリパラメータをURLSearchParamsに変換
 */
function buildQueryParams(params: DashboardQueryParams): string {
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
 * ダッシュボード全体データを取得
 */
export async function getDashboardData(
  params: DashboardQueryParams = {}
): Promise<DashboardResponse> {
  const query = buildQueryParams(params)
  return apiClient.get<DashboardResponse>(`${BASE_PATH}${query}`)
}

/**
 * 全社サマリーのみ取得
 */
export async function getCompanySummary(
  params: DashboardQueryParams = {}
): Promise<CompanySummary> {
  const query = buildQueryParams(params)
  return apiClient.get<CompanySummary>(`${BASE_PATH}/summary${query}`)
}

/**
 * キャッシュフローデータを取得
 */
export async function getCashFlow(
  params: DashboardQueryParams = {}
): Promise<CashFlowData> {
  const query = buildQueryParams(params)
  return apiClient.get<CashFlowData>(`${BASE_PATH}/cashflow${query}`)
}

/**
 * 推移グラフデータを取得
 */
export async function getChartData(
  months: number = 12
): Promise<ChartDataPoint[]> {
  return apiClient.get<ChartDataPoint[]>(`${BASE_PATH}/chart?months=${months}`)
}

/**
 * アラートを取得
 */
export async function getDashboardAlerts(
  params: DashboardQueryParams = {}
): Promise<DashboardAlertItem[]> {
  const query = buildQueryParams(params)
  return apiClient.get<DashboardAlertItem[]>(`${BASE_PATH}/alerts${query}`)
}
