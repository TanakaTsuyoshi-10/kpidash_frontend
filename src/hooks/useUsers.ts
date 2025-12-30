/**
 * 利用者管理API呼び出しフック
 */
'use client'

import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api/client'
import type {
  CurrentUserResponse,
  UserListResponse,
  UserProfileResponse,
  UserRoleListResponse,
  UserProfileCreate,
  UserProfileUpdate,
  UserOperationResult,
} from '@/types/user'

// 現在のユーザー情報取得
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUserResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<CurrentUserResponse>('/api/v1/users/me')
      setUser(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { user, loading, error, fetchCurrentUser }
}

// ユーザー一覧取得
export function useUserList() {
  const [users, setUsers] = useState<UserProfileResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<UserListResponse>('/api/v1/users')
      setUsers(data.users)
      setTotal(data.total)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { users, total, loading, error, fetchUsers }
}

// 権限一覧取得
export function useUserRoles() {
  const [roles, setRoles] = useState<UserRoleListResponse['roles']>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<UserRoleListResponse>('/api/v1/users/roles/list')
      setRoles(data.roles)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { roles, loading, error, fetchRoles }
}

// ユーザー操作
export function useUserOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createUser = useCallback(async (data: UserProfileCreate): Promise<UserOperationResult> => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.post<UserOperationResult>('/api/v1/users', data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateUser = useCallback(async (userId: string, data: UserProfileUpdate): Promise<UserOperationResult> => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.patch<UserOperationResult>(`/api/v1/users/${userId}`, data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateMyProfile = useCallback(async (displayName: string): Promise<UserOperationResult> => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.patch<UserOperationResult>(
        `/api/v1/users/me?display_name=${encodeURIComponent(displayName)}`
      )
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deactivateUser = useCallback(async (userId: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.delete(`/api/v1/users/${userId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    createUser,
    updateUser,
    updateMyProfile,
    deactivateUser,
  }
}
