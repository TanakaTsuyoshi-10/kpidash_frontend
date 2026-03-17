/**
 * ふるさと納税分析の型定義
 */

// 週次データ（各指標に対して第1〜5週の配列）
export type WeeklyData = Record<string, (number | null)[]> | null

// 販売実績
export interface FurusatoSalesData {
  inventory: number | null
  orders: number | null
  sales: number | null
  unit_price: number | null
  orders_kyushu: number | null
  orders_chugoku_shikoku: number | null
  orders_kansai: number | null
  orders_kanto: number | null
  orders_other: number | null
  cumulative_orders: number | null
  cumulative_sales: number | null
  weekly: WeeklyData
}

// リピート情報
export interface FurusatoRepeatData {
  new_customers: number | null
  cumulative_new_customers: number | null
  ec_site_buyers: number | null
  repeat_buyers: number | null
  repeat_single_month: number | null
  repeat_multi_month: number | null
  weekly: WeeklyData
}

// 返品・苦情
export interface FurusatoComplaintData {
  reshipping_count: number | null
  complaint_count: number | null
  weekly: WeeklyData
}

// 口コミ
export interface FurusatoReviewData {
  positive_reviews: number | null
  negative_reviews: number | null
  weekly: WeeklyData
}

// サマリーレスポンス
export interface FurusatoSummaryResponse {
  period: string
  period_type: 'monthly' | 'cumulative'
  fiscal_year: number | null
  sales: FurusatoSalesData
  repeat: FurusatoRepeatData
  complaint: FurusatoComplaintData
  review: FurusatoReviewData
  comments: {
    sales: string | null
    repeat: string | null
    complaint: string | null
    review: string | null
  }
}

// アップロードレスポンス
export interface FurusatoUploadResponse {
  success: boolean
  message: string
  month: string
  records_processed: number
}
