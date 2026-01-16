/**
 * ユーザー管理関連の型定義
 */

// 権限
export type UserRole = 'admin' | 'user'

// 現在のユーザー情報
export interface CurrentUserResponse {
  id: string
  email: string
  display_name: string | null
  role: UserRole
  is_admin: boolean
}

// ユーザープロファイル
export interface UserProfileResponse {
  id: string
  email: string
  display_name: string | null
  role: UserRole
  role_name: string | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
  last_sign_in_at: string | null
}

// ユーザー一覧
export interface UserListResponse {
  users: UserProfileResponse[]
  total: number
}

// 権限情報
export interface UserRoleInfo {
  code: string
  name: string
  description: string | null
}

export interface UserRoleListResponse {
  roles: UserRoleInfo[]
}

// リクエスト
export interface UserProfileCreate {
  email: string
  password: string
  display_name?: string
  role?: UserRole
}

export interface UserProfileUpdate {
  display_name?: string
  role?: UserRole
  is_active?: boolean
}

// 操作結果
export interface UserOperationResult {
  success: boolean
  message: string
  user_id: string | null
}
