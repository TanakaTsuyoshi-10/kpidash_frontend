/**
 * クレーム管理API
 */
import { apiClient } from './client'
import type {
  ComplaintCreate,
  ComplaintUpdate,
  ComplaintDetail,
  ComplaintListResponse,
  ComplaintFilterParams,
  ComplaintMasterDataResponse,
  ComplaintDashboardSummary,
} from '@/types/complaint'

const BASE_PATH = '/api/v1/complaints'

/**
 * クエリパラメータをURLSearchParamsに変換
 */
function buildQueryParams(params: ComplaintFilterParams): string {
  const searchParams = new URLSearchParams()

  if (params.status) {
    searchParams.append('status', params.status)
  }
  if (params.department_type) {
    searchParams.append('department_type', params.department_type)
  }
  if (params.complaint_type) {
    searchParams.append('complaint_type', params.complaint_type)
  }
  if (params.from_date) {
    searchParams.append('start_date', params.from_date)
  }
  if (params.to_date) {
    searchParams.append('end_date', params.to_date)
  }
  if (params.search) {
    searchParams.append('search', params.search)
  }
  if (params.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params.page_size !== undefined) {
    searchParams.append('page_size', params.page_size.toString())
  }

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * マスタデータ取得
 */
export async function getComplaintMaster(): Promise<ComplaintMasterDataResponse> {
  return apiClient.get<ComplaintMasterDataResponse>(`${BASE_PATH}/master`)
}

/**
 * クレーム一覧取得
 */
export async function getComplaints(
  params: ComplaintFilterParams = {}
): Promise<ComplaintListResponse> {
  const query = buildQueryParams(params)
  return apiClient.get<ComplaintListResponse>(`${BASE_PATH}/${query}`)
}

/**
 * クレーム詳細取得
 */
export async function getComplaint(id: string): Promise<ComplaintDetail> {
  return apiClient.get<ComplaintDetail>(`${BASE_PATH}/${id}`)
}

/**
 * クレーム新規作成
 */
export async function createComplaint(
  data: ComplaintCreate
): Promise<ComplaintDetail> {
  return apiClient.post<ComplaintDetail>(`${BASE_PATH}/`, data)
}

/**
 * クレーム更新
 */
export async function updateComplaint(
  id: string,
  data: ComplaintUpdate
): Promise<ComplaintDetail> {
  return apiClient.put<ComplaintDetail>(`${BASE_PATH}/${id}`, data)
}

/**
 * クレーム削除
 */
export async function deleteComplaint(id: string): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/${id}`)
}

/**
 * ダッシュボード用サマリー取得
 */
export async function getComplaintDashboardSummary(
  month: string
): Promise<ComplaintDashboardSummary> {
  return apiClient.get<ComplaintDashboardSummary>(
    `${BASE_PATH}/summary/dashboard?month=${month}`
  )
}
