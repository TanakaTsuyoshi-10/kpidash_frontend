/**
 * 地区別分析のAPI関数
 */
import { apiClient } from './client'
import type {
  RegionsResponse,
  StoreMappingsResponse,
  RegionalSummaryResponse,
  PeriodType,
} from '@/types/regional'

/**
 * 地区一覧を取得する
 */
export async function getRegions(): Promise<RegionsResponse> {
  return apiClient.get<RegionsResponse>('/regional/regions')
}

/**
 * 店舗マッピングを取得する
 */
export async function getStoreMappings(): Promise<StoreMappingsResponse> {
  return apiClient.get<StoreMappingsResponse>('/regional/store-mappings')
}

/**
 * 店舗マッピングを初期化する
 */
export async function initializeStoreMappings(): Promise<StoreMappingsResponse> {
  return apiClient.post<StoreMappingsResponse>('/regional/store-mappings/initialize')
}

/**
 * 地区別集計を取得する
 */
export async function getRegionalSummary(
  month: string,
  periodType: PeriodType,
  departmentSlug: string = 'store'
): Promise<RegionalSummaryResponse> {
  const params = new URLSearchParams({
    month,
    department_slug: departmentSlug,
    period_type: periodType,
  })
  return apiClient.get<RegionalSummaryResponse>(`/regional/summary?${params}`)
}
