/**
 * ユーザー管理 APIクライアント
 */
import { apiClient } from '@/lib/api/client'
import type { PageKey, UserPagePermissionsResponse, UserOperationResult } from '@/types/user'

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
