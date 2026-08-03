/**
 * 日次販売分析のAPI関数
 */
import { apiClient } from './client'
import type {
  DailySalesSummaryResponse,
  HourlySalesResponse,
  DailyTrendResponse,
  ReceiptJournalUploadResult,
  WeekdayAnalysisResponse,
  StoreHourlyCustomersResponse,
} from '@/types/daily-sales'

/**
 * 日別×店舗サマリーを取得する
 */
export async function getDailySalesSummary(
  month: string,
  departmentSlug: string = 'store',
): Promise<DailySalesSummaryResponse> {
  const params = new URLSearchParams({
    month,
    department_slug: departmentSlug,
  })
  return apiClient.get<DailySalesSummaryResponse>(`/daily-sales/summary?${params.toString()}`)
}

/**
 * 時間帯別ヒートマップデータを取得する
 */
export async function getHourlySales(
  date: string,
  departmentSlug: string = 'store',
): Promise<HourlySalesResponse> {
  const params = new URLSearchParams({
    date,
    department_slug: departmentSlug,
  })
  return apiClient.get<HourlySalesResponse>(`/daily-sales/hourly?${params.toString()}`)
}

/**
 * 日次推移データを取得する
 */
export async function getDailyTrend(
  month: string,
  segmentId?: string,
  departmentSlug: string = 'store',
): Promise<DailyTrendResponse> {
  const params = new URLSearchParams({
    month,
    department_slug: departmentSlug,
  })
  if (segmentId) params.append('segment_id', segmentId)
  return apiClient.get<DailyTrendResponse>(`/daily-sales/trend?${params.toString()}`)
}

/**
 * レシートジャーナルCSVをアップロードする
 */
export async function uploadReceiptJournal(
  file: File,
): Promise<ReceiptJournalUploadResult> {
  return apiClient.uploadFile<ReceiptJournalUploadResult>('/upload/receipt-journal', file)
}

/**
 * 時間帯別ヒートマップデータ（月間合計）を取得する
 */
export async function getHourlySalesMonth(
  month: string,
  departmentSlug: string = 'store',
): Promise<HourlySalesResponse> {
  const params = new URLSearchParams({
    month,
    department_slug: departmentSlug,
  })
  return apiClient.get<HourlySalesResponse>(`/daily-sales/hourly-month?${params.toString()}`)
}

/**
 * 曜日別分析（平日/土日祝）を取得する
 */
export async function getWeekdayAnalysis(
  month: string,
  departmentSlug: string = 'store',
  segmentId?: string,
): Promise<WeekdayAnalysisResponse> {
  const params = new URLSearchParams({
    month,
    department_slug: departmentSlug,
  })
  if (segmentId) params.append('segment_id', segmentId)
  return apiClient.get<WeekdayAnalysisResponse>(`/daily-sales/weekday-analysis?${params.toString()}`)
}

/**
 * 店舗の日別×時間帯 来客ヒートマップを取得する
 */
export async function getStoreHourlyCustomers(
  month: string,
  segmentId: string,
): Promise<StoreHourlyCustomersResponse> {
  const params = new URLSearchParams({
    month,
    segment_id: segmentId,
  })
  return apiClient.get<StoreHourlyCustomersResponse>(`/daily-sales/hourly-customers-daily?${params.toString()}`)
}
