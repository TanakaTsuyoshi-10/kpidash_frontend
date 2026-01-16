/**
 * 通販分析のAPI関数
 */
import { apiClient } from './client'
import type {
  ChannelSummaryResponse,
  ProductSummaryResponse,
  CustomerSummaryResponse,
  WebsiteStatsResponse,
  TrendResponse,
  EcommerceBulkUploadResponse,
  PeriodType,
} from '@/types/ecommerce'

/**
 * チャネル別実績を取得
 */
export async function getChannelSummary(
  month: string,
  periodType: PeriodType = 'monthly'
): Promise<ChannelSummaryResponse> {
  const params = new URLSearchParams({
    month,
    period_type: periodType,
  })
  return apiClient.get<ChannelSummaryResponse>(`/ecommerce/channel-summary?${params.toString()}`)
}

/**
 * 商品別実績を取得
 */
export async function getProductSummary(
  month: string,
  periodType: PeriodType = 'monthly',
  limit: number = 20
): Promise<ProductSummaryResponse> {
  const params = new URLSearchParams({
    month,
    period_type: periodType,
    limit: limit.toString(),
  })
  return apiClient.get<ProductSummaryResponse>(`/ecommerce/product-summary?${params.toString()}`)
}

/**
 * 顧客別実績を取得
 */
export async function getCustomerSummary(
  month: string,
  periodType: PeriodType = 'monthly'
): Promise<CustomerSummaryResponse> {
  const params = new URLSearchParams({
    month,
    period_type: periodType,
  })
  return apiClient.get<CustomerSummaryResponse>(`/ecommerce/customer-summary?${params.toString()}`)
}

/**
 * HPアクセス数を取得
 */
export async function getWebsiteStats(
  month: string,
  periodType: PeriodType = 'monthly'
): Promise<WebsiteStatsResponse> {
  const params = new URLSearchParams({
    month,
    period_type: periodType,
  })
  return apiClient.get<WebsiteStatsResponse>(`/ecommerce/website-stats?${params.toString()}`)
}

/**
 * 推移データを取得
 */
export async function getEcommerceTrend(
  metric: 'channel_sales' | 'product_sales' | 'customers' | 'website',
  fiscalYear?: number
): Promise<TrendResponse> {
  const params = new URLSearchParams({ metric })
  if (fiscalYear) {
    params.append('fiscal_year', fiscalYear.toString())
  }
  return apiClient.get<TrendResponse>(`/ecommerce/trend?${params.toString()}`)
}

/**
 * Excelテンプレートをダウンロード
 */
export async function downloadEcommerceTemplate(): Promise<void> {
  return apiClient.downloadFile('/ecommerce/template-excel', '通販データ入力テンプレート.xlsx')
}

/**
 * Excelファイルをアップロード
 */
export async function uploadEcommerceExcel(file: File): Promise<EcommerceBulkUploadResponse> {
  return apiClient.uploadFile<EcommerceBulkUploadResponse>('/ecommerce/upload-excel', file)
}
