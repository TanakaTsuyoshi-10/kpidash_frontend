/**
 * アップロード関連の型定義
 */

/**
 * CSVファイルの種別
 */
export type FileType = 'store' | 'product'

/**
 * アップロード結果（店舗別）
 */
export interface StoreUploadResult {
  success: boolean
  period: string
  imported_count: number
  errors: string[]
  warnings: string[]
}

/**
 * アップロード結果（商品別）
 */
export interface ProductUploadResult {
  success: boolean
  period: string
  imported_count: number
  new_products: string[]
  unmapped_products: string[]
  stores_processed: Array<{
    store_code: string
    store_name: string
  }>
  errors: string[]
  warnings: string[]
}

/**
 * アップロード結果（共通型）
 */
export type UploadResult = StoreUploadResult | ProductUploadResult

/**
 * アップロード履歴レスポンス
 */
export interface UploadHistoryResponse {
  uploads: unknown[]
  message: string
}

/**
 * KPI値
 */
export interface KPIValue {
  id: string
  kpi_id: string
  kpi_name?: string
  segment_id: string
  segment_name?: string
  period: string
  value: number
  is_target: boolean
  created_at?: string
  updated_at?: string
}

/**
 * KPI値一覧レスポンス
 */
export interface KPIValuesResponse {
  items: KPIValue[]
  total: number
}

/**
 * ファイル種別のオプション
 */
export const FILE_TYPE_OPTIONS = [
  {
    value: 'store' as FileType,
    label: '売上集計-店舗別',
    description: '店舗別の売上・客数データ',
    endpoint: '/upload/store-kpi'
  },
  {
    value: 'product' as FileType,
    label: '売上集計-商品別',
    description: '商品別の売上データ（店舗別に集計）',
    endpoint: '/upload/product-kpi'
  },
] as const

/**
 * ファイル種別からエンドポイントを取得
 */
export function getUploadEndpoint(fileType: FileType): string {
  const option = FILE_TYPE_OPTIONS.find(o => o.value === fileType)
  return option?.endpoint ?? '/upload/store-kpi'
}

/**
 * 目標値入力フォームのデータ
 */
export interface TargetFormData {
  kpi_name: string
  period: string
  target_value: number
  department_id?: string
}

/**
 * 目標値
 */
export interface TargetValue {
  id?: string
  kpi_name: string
  period: string
  target_value: number
  department_id?: string
  created_at?: string
  updated_at?: string
}

/**
 * 目標値一覧レスポンス
 */
export interface TargetValuesResponse {
  items: TargetValue[]
  total: number
}

/**
 * KPI項目のオプション（目標設定用）
 */
export const KPI_OPTIONS = [
  { value: '売上高', label: '売上高' },
  { value: '粗利益', label: '粗利益' },
  { value: '客数', label: '客数' },
  { value: '客単価', label: '客単価' },
] as const
