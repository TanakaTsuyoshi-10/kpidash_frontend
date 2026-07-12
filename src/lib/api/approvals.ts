/**
 * 承認ワークフローAPI
 */
import { apiClient } from './client'
import { getSessionToken } from '@/lib/swr-config'
import type {
  ApprovalDelegate,
  ApprovalDelegateCreatePayload,
  ApprovalRequestCreatePayload,
  ApprovalRequestDetail,
  ApprovalRequestListResponse,
  ApprovalRequestSubmitPayload,
  AttachmentUploadResponse,
  PendingCountResponse,
  RequestType,
  SlackChannelBinding,
} from '@/types/approval'

const BASE = '/api/v1/approvals'
const TYPES_BASE = '/api/v1/approval-types'
const DELEGATES_BASE = '/api/v1/approval-delegates'
const API_URL = process.env.NEXT_PUBLIC_API_URL

// ---- 申請 ----

export async function getApprovalRequests(
  tab: 'todo' | 'mine' | 'all'
): Promise<ApprovalRequestListResponse> {
  return apiClient.get(`${BASE}/?tab=${tab}`)
}

export async function getPendingCount(): Promise<PendingCountResponse> {
  return apiClient.get(`${BASE}/pending-count`)
}

export async function getAssignableUsers(): Promise<
  Array<{ id: string; email: string; display_name: string }>
> {
  return apiClient.get(`${BASE}/assignable-users`)
}

export async function getApprovalRequest(id: string): Promise<ApprovalRequestDetail> {
  return apiClient.get(`${BASE}/${id}`)
}

export async function createDraft(
  data: ApprovalRequestCreatePayload
): Promise<ApprovalRequestDetail> {
  return apiClient.post(`${BASE}/`, data)
}

export async function updateDraft(
  id: string,
  data: ApprovalRequestCreatePayload
): Promise<ApprovalRequestDetail> {
  return apiClient.put(`${BASE}/${id}`, data)
}

export async function submitRequest(
  id: string,
  data: ApprovalRequestSubmitPayload
): Promise<ApprovalRequestDetail> {
  return apiClient.post(`${BASE}/${id}/submit`, data)
}

export async function approveStep(
  requestId: string,
  stepId: string,
  comment?: string
): Promise<ApprovalRequestDetail> {
  return apiClient.post(`${BASE}/${requestId}/steps/${stepId}/approve`, { comment })
}

export async function rejectStep(
  requestId: string,
  stepId: string,
  comment?: string
): Promise<ApprovalRequestDetail> {
  return apiClient.post(`${BASE}/${requestId}/steps/${stepId}/reject`, { comment })
}

export async function returnToRequester(
  requestId: string,
  stepId: string,
  comment?: string
): Promise<ApprovalRequestDetail> {
  return apiClient.post(`${BASE}/${requestId}/steps/${stepId}/return`, { comment })
}

export async function cancelRequest(id: string): Promise<ApprovalRequestDetail> {
  return apiClient.post(`${BASE}/${id}/cancel`)
}

export async function reassignStep(
  requestId: string,
  stepId: string,
  newAssigneeId: string,
  comment?: string
): Promise<ApprovalRequestDetail> {
  return apiClient.post(`${BASE}/${requestId}/reassign`, {
    step_id: stepId,
    new_assignee_id: newAssigneeId,
    comment,
  })
}

export async function republish(id: string): Promise<ApprovalRequestDetail> {
  return apiClient.post(`${BASE}/${id}/republish`)
}

// ---- 添付アップロード ----

export async function uploadAttachment(file: File): Promise<AttachmentUploadResponse> {
  const token = await getSessionToken()
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_URL}${BASE}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || '画像のアップロードに失敗しました')
  }
  return res.json()
}

// ---- 申請種別 ----

export async function getRequestTypes(includeInactive = false): Promise<RequestType[]> {
  return apiClient.get(`${TYPES_BASE}/?include_inactive=${includeInactive}`)
}

export async function createRequestType(data: {
  code: string
  label: string
  description?: string
  default_approval_mode?: string
}): Promise<RequestType> {
  return apiClient.post(`${TYPES_BASE}/`, data)
}

export async function updateRequestType(
  code: string,
  data: Partial<Pick<RequestType, 'label' | 'description' | 'default_approval_mode' | 'is_active' | 'display_order'>>
): Promise<RequestType> {
  return apiClient.put(`${TYPES_BASE}/${code}`, data)
}

// ---- Slack 投稿先 ----

export async function getChannelBindings(
  requestType?: string
): Promise<SlackChannelBinding[]> {
  const q = requestType ? `?request_type=${encodeURIComponent(requestType)}` : ''
  return apiClient.get(`${TYPES_BASE}/channel-bindings${q}`)
}

export async function createChannelBinding(data: {
  request_type: string
  label: string
  channel_id: string
  channel_name?: string
  is_default?: boolean
}): Promise<SlackChannelBinding> {
  return apiClient.post(`${TYPES_BASE}/channel-bindings`, data)
}

export async function deleteChannelBinding(id: string): Promise<void> {
  return apiClient.delete(`${TYPES_BASE}/channel-bindings/${id}`)
}

// ---- 代理設定 ----

export async function getDelegates(allUsers = false): Promise<ApprovalDelegate[]> {
  return apiClient.get(`${DELEGATES_BASE}/?all_users=${allUsers}`)
}

export async function createDelegate(
  data: ApprovalDelegateCreatePayload
): Promise<ApprovalDelegate> {
  return apiClient.post(`${DELEGATES_BASE}/`, data)
}

export async function deleteDelegate(id: string): Promise<void> {
  return apiClient.delete(`${DELEGATES_BASE}/${id}`)
}
