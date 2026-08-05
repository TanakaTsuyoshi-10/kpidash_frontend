/**
 * ユーザー管理 APIクライアント
 */
import { apiClient } from '@/lib/api/client'
import type {
  OrgDepartment,
  OrgDepartmentListResponse,
  PageKey,
  UserPagePermissionsResponse,
  UserOperationResult,
} from '@/types/user'

export async function getUserPermissions(userId: string): Promise<UserPagePermissionsResponse> {
  return apiClient.get<UserPagePermissionsResponse>(`/api/v1/users/${userId}/permissions`)
}

export async function updateUserPermissions(
  userId: string,
  pageKeys: PageKey[]
): Promise<UserOperationResult> {
  return apiClient.put<UserOperationResult>(`/api/v1/users/${userId}/permissions`, {
    page_keys: pageKeys,
  })
}

export async function getOrgDepartments(includeInactive = false): Promise<OrgDepartmentListResponse> {
  return apiClient.get<OrgDepartmentListResponse>(
    `/api/v1/users/org-departments?include_inactive=${includeInactive}`
  )
}

export async function createOrgDepartment(name: string, displayOrder = 0): Promise<OrgDepartment> {
  return apiClient.post<OrgDepartment>('/api/v1/users/org-departments', {
    name,
    display_order: displayOrder,
  })
}

export async function updateOrgDepartment(
  id: string,
  data: { name?: string; display_order?: number; is_active?: boolean }
): Promise<OrgDepartment> {
  return apiClient.put<OrgDepartment>(`/api/v1/users/org-departments/${id}`, data)
}
