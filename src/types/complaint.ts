/**
 * クレーム管理関連の型定義
 * バックエンドスキーマに準拠
 */

// 発生部署種類
export type DepartmentType = 'store' | 'ecommerce' | 'headquarters'

// 顧客種類
export type CustomerType = 'new' | 'repeat' | 'unknown'

// クレーム種類
export type ComplaintType = 'customer_service' | 'facility' | 'operation' | 'product' | 'other'

// 対応状況
export type ComplaintStatus = 'in_progress' | 'completed'

// クレーム作成リクエスト
export interface ComplaintCreate {
  incident_date: string        // YYYY-MM-DD
  department_type: DepartmentType
  segment_id?: string | null   // 店舗IDst（店舗の場合のみ）
  customer_type: CustomerType
  customer_name?: string | null
  contact_info?: string | null
  complaint_type: ComplaintType
  complaint_content: string
  responder_name?: string | null
  status?: ComplaintStatus     // default: 'in_progress'
  response_summary?: string | null
  resolution_cost?: number     // default: 0
}

// クレーム更新リクエスト
export interface ComplaintUpdate {
  incident_date?: string
  department_type?: DepartmentType
  segment_id?: string | null
  customer_type?: CustomerType
  customer_name?: string | null
  contact_info?: string | null
  complaint_type?: ComplaintType
  complaint_content?: string
  responder_name?: string | null
  status?: ComplaintStatus
  response_summary?: string | null
  resolution_cost?: number
}

// クレーム一覧アイテム
export interface ComplaintListItem {
  id: string
  incident_date: string
  department_type: string
  department_type_name: string
  segment_name: string | null
  customer_type_name: string
  complaint_type: string
  complaint_type_name: string
  complaint_content: string
  status: string
  status_name: string
  responder_name: string | null
  resolution_cost: number
  created_at: string
}

// クレーム詳細
export interface ComplaintDetail {
  id: string
  incident_date: string
  registered_at: string
  department_type: string
  department_type_name: string
  segment_id: string | null
  segment_name: string | null
  customer_type: string
  customer_type_name: string
  customer_name: string | null
  contact_info: string | null
  complaint_type: string
  complaint_type_name: string
  complaint_content: string
  responder_name: string | null
  status: string
  status_name: string
  response_summary: string | null
  resolution_cost: number
  completed_at: string | null
  created_by_email: string | null
  created_at: string
  updated_at: string
}

// 一覧レスポンス
export interface ComplaintListResponse {
  complaints: ComplaintListItem[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
}

// フィルターパラメータ
export interface ComplaintFilterParams {
  status?: ComplaintStatus
  department_type?: DepartmentType
  complaint_type?: ComplaintType
  from_date?: string
  to_date?: string
  search?: string
  page?: number
  page_size?: number
}

// マスタデータ
export interface ComplaintTypeMaster {
  code: string
  name: string
  display_order: number
}

export interface DepartmentTypeMaster {
  code: string
  name: string
  display_order: number
}

export interface CustomerTypeMaster {
  code: string
  name: string
  display_order: number
}

export interface ComplaintMasterDataResponse {
  complaint_types: ComplaintTypeMaster[]
  department_types: DepartmentTypeMaster[]
  customer_types: CustomerTypeMaster[]
}

// ダッシュボード用サマリー
export interface ComplaintDashboardSummary {
  current_month_count: number
  previous_month_count: number
  yoy_rate: number | null
  in_progress_count: number
}
