/**
 * ユーザー管理関連の型定義
 */

// 権限
export type UserRole = 'admin' | 'executive' | 'user'

// 権限の表示名
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理者',
  executive: '役員',
  user: '一般利用者',
}

// ページキー
export const PAGE_KEYS = [
  'dashboard', 'finance', 'ecommerce', 'manufacturing', 'complaints', 'products', 'upload', 'targets', 'board', 'labor', 'slack', 'approvals'
] as const
export type PageKey = typeof PAGE_KEYS[number]

export const PAGE_LABELS: Record<PageKey, string> = {
  dashboard: 'ダッシュボード',
  finance: '財務分析',
  ecommerce: '通販分析',
  manufacturing: '製造分析',
  complaints: 'クレーム管理',
  products: '店舗分析',
  upload: 'データアップロード',
  targets: '目標管理',
  board: '取締役会',
  labor: '経営指標（人件費・時間外）',
  slack: 'Slack投稿',
  approvals: '承認ワークフロー',
}

// 現在のユーザー情報
export interface CurrentUserResponse {
  id: string
  email: string
  display_name: string | null
  role: UserRole
  is_admin: boolean
  /** アカウントが有効か。false の場合はログイン拒否対象 */
  is_active: boolean
  allowed_pages: PageKey[]
  org_department_id: string | null
  org_department_name: string | null
  position: string | null
  /** 承認権限（承認者に指定可能か） */
  can_approve: boolean
  /** 稟議の全社閲覧権限 */
  approval_view_all: boolean
}

// ページ権限
export interface UserPagePermissionsResponse {
  user_id: string
  allowed_pages: PageKey[]
}

// ユーザープロファイル
export interface UserProfileResponse {
  id: string
  email: string
  display_name: string | null
  role: UserRole
  role_name: string | null
  is_active: boolean
  org_department_id: string | null
  org_department_name: string | null
  position: string | null
  can_approve: boolean
  approval_view_all: boolean
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
  org_department_id?: string | null
  position?: string
  can_approve?: boolean
  approval_view_all?: boolean
}

export interface UserProfileUpdate {
  display_name?: string
  role?: UserRole
  is_active?: boolean
  /** "" を渡すと部署未設定にクリア */
  org_department_id?: string
  position?: string
  can_approve?: boolean
  approval_view_all?: boolean
}

// 部署マスタ
export interface OrgDepartment {
  id: string
  name: string
  display_order: number
  is_active: boolean
}

export interface OrgDepartmentListResponse {
  departments: OrgDepartment[]
}

// 操作結果
export interface UserOperationResult {
  success: boolean
  message: string
  user_id: string | null
}
