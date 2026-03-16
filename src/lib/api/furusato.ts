/**
 * ふるさと納税分析のAPI関数
 */
import { apiClient } from './client'
import type {
  FurusatoSummaryResponse,
  FurusatoUploadResponse,
} from '@/types/furusato'
import type { PeriodType } from '@/types/ecommerce'

/**
 * ふるさと納税サマリーを取得
 */
export async function getFurusatoSummary(
  month: string,
  periodType: PeriodType = 'monthly'
): Promise<FurusatoSummaryResponse> {
  const params = new URLSearchParams({
    month,
    period_type: periodType,
  })
  return apiClient.get<FurusatoSummaryResponse>(`/furusato/summary?${params.toString()}`)
}

/**
 * ふるさと納税Excelファイルをアップロード
 */
export async function uploadFurusatoExcel(file: File): Promise<FurusatoUploadResponse> {
  return apiClient.uploadFile<FurusatoUploadResponse>('/furusato/upload-excel', file)
}
