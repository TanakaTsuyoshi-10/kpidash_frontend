/**
 * 目標値管理のAPI関数
 */
import { apiClient } from './client'
import type {
  TargetMatrixResponse,
  TargetValueCreate,
  TargetValueUpdate,
  TargetValueResponse,
  TargetBulkRequest,
  TargetBulkResponse,
  TargetOverview,
  StoreTargetBulkInput,
  FinancialTargetResponse,
  FinancialTargetInput,
  EcommerceTargetResponse,
  EcommerceTargetInput,
  TargetSettingResult,
} from '@/types/target'

/**
 * 目標値マトリックス取得（入力画面用）
 */
export async function getTargetMatrix(
  departmentSlug: string,
  month: string
): Promise<TargetMatrixResponse> {
  const params = new URLSearchParams({
    department_slug: departmentSlug,
    month,
  })
  return apiClient.get<TargetMatrixResponse>(`/kpi/targets/matrix?${params.toString()}`)
}

/**
 * 目標値一覧取得
 */
export async function getTargets(
  departmentSlug: string,
  month: string,
  options?: { segmentId?: string; kpiId?: string }
): Promise<TargetValueResponse[]> {
  const params = new URLSearchParams({
    department_slug: departmentSlug,
    month,
  })
  if (options?.segmentId) params.append('segment_id', options.segmentId)
  if (options?.kpiId) params.append('kpi_id', options.kpiId)
  return apiClient.get<TargetValueResponse[]>(`/kpi/targets?${params.toString()}`)
}

/**
 * 目標値登録（単一）
 */
export async function createTarget(
  data: TargetValueCreate
): Promise<TargetValueResponse> {
  return apiClient.post<TargetValueResponse>('/kpi/targets', data)
}

/**
 * 目標値更新
 */
export async function updateTarget(
  targetId: number,
  data: TargetValueUpdate
): Promise<TargetValueResponse> {
  return apiClient.put<TargetValueResponse>(`/kpi/targets/${targetId}`, data)
}

/**
 * 目標値削除
 */
export async function deleteTarget(targetId: number): Promise<void> {
  return apiClient.delete(`/kpi/targets/${targetId}`)
}

/**
 * 目標値一括登録
 */
export async function bulkCreateTargets(
  data: TargetBulkRequest
): Promise<TargetBulkResponse> {
  return apiClient.post<TargetBulkResponse>('/kpi/targets/bulk', data)
}

// =============================================================================
// 目標設定 新API (api/v1/targets)
// =============================================================================

const TARGETS_BASE = '/api/v1/targets'

/**
 * 目標概要取得
 */
export async function getTargetOverview(month: string): Promise<TargetOverview> {
  return apiClient.get<TargetOverview>(`${TARGETS_BASE}/overview?month=${month}`)
}

/**
 * 店舗目標取得
 */
export async function getStoreTargets(month: string): Promise<TargetMatrixResponse> {
  return apiClient.get<TargetMatrixResponse>(`${TARGETS_BASE}/store?month=${month}`)
}

/**
 * 店舗目標一括保存
 */
export async function saveStoreTargets(data: StoreTargetBulkInput): Promise<TargetSettingResult> {
  return apiClient.post<TargetSettingResult>(`${TARGETS_BASE}/store`, data)
}

/**
 * 財務目標取得
 */
export async function getFinancialTargets(month: string): Promise<FinancialTargetResponse> {
  return apiClient.get<FinancialTargetResponse>(`${TARGETS_BASE}/financial?month=${month}`)
}

/**
 * 財務目標保存
 */
export async function saveFinancialTargets(data: FinancialTargetInput): Promise<TargetSettingResult> {
  return apiClient.post<TargetSettingResult>(`${TARGETS_BASE}/financial`, data)
}

/**
 * 通販目標取得
 */
export async function getEcommerceTargets(month: string): Promise<EcommerceTargetResponse> {
  return apiClient.get<EcommerceTargetResponse>(`${TARGETS_BASE}/ecommerce?month=${month}`)
}

/**
 * 通販目標保存
 */
export async function saveEcommerceTargets(data: EcommerceTargetInput): Promise<TargetSettingResult> {
  return apiClient.post<TargetSettingResult>(`${TARGETS_BASE}/ecommerce`, data)
}
