/**
 * 製造分析API
 */
import { apiClient } from './client'
import type {
  ManufacturingAnalysisResponse,
  ManufacturingMonthlySummary,
  ManufacturingDailyData,
  ManufacturingComparison,
  ManufacturingChartData,
  ManufacturingUploadResult,
  ManufacturingQueryParams,
} from '@/types/manufacturing'

const API_URL = process.env.NEXT_PUBLIC_API_URL
const BASE_PATH = '/api/v1/manufacturing'

/**
 * クエリパラメータをURLSearchParamsに変換
 */
function buildQueryParams(params: ManufacturingQueryParams): string {
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
 * 製造分析データ取得
 */
export async function getManufacturingAnalysis(
  params: ManufacturingQueryParams = {}
): Promise<ManufacturingAnalysisResponse> {
  const query = buildQueryParams(params)
  return apiClient.get<ManufacturingAnalysisResponse>(`${BASE_PATH}${query}`)
}

/**
 * 月次サマリーのみ取得
 */
export async function getManufacturingSummary(
  params: ManufacturingQueryParams = {}
): Promise<ManufacturingMonthlySummary> {
  const query = buildQueryParams(params)
  return apiClient.get<ManufacturingMonthlySummary>(`${BASE_PATH}/summary${query}`)
}

/**
 * 日次データ取得
 */
export async function getManufacturingDaily(
  year: number,
  month: number
): Promise<ManufacturingDailyData[]> {
  const params = new URLSearchParams({
    year: year.toString(),
    month: month.toString(),
  })
  return apiClient.get<ManufacturingDailyData[]>(`${BASE_PATH}/daily?${params}`)
}

/**
 * 比較データ取得
 */
export async function getManufacturingComparison(
  params: ManufacturingQueryParams = {}
): Promise<ManufacturingComparison> {
  const query = buildQueryParams(params)
  return apiClient.get<ManufacturingComparison>(`${BASE_PATH}/comparison${query}`)
}

/**
 * グラフデータ取得
 */
export async function getManufacturingChart(
  months: number = 12
): Promise<ManufacturingChartData[]> {
  return apiClient.get<ManufacturingChartData[]>(`${BASE_PATH}/chart?months=${months}`)
}

/**
 * 製造データアップロード
 */
export async function uploadManufacturingData(file: File): Promise<ManufacturingUploadResult> {
  return apiClient.uploadFile<ManufacturingUploadResult>('/upload/manufacturing', file)
}

/**
 * テンプレートダウンロードURL取得
 */
export function getManufacturingTemplateUrl(year: number, month: number): string {
  return `${API_URL}/api/v1/templates/manufacturing?year=${year}&month=${month}`
}
