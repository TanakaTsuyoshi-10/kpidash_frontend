/**
 * 承認ワークフロー型定義
 */

export type ApprovalMode = 'sequential' | 'parallel_and' | 'parallel_or'

export type ApprovalRequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'published'
  | 'publish_failed'

export type ApprovalStepStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'skipped'
  | 'delegated'

export const APPROVAL_MODE_LABELS: Record<ApprovalMode, string> = {
  sequential: '順次承認（1人ずつ順番に）',
  parallel_and: '全員承認（同時回覧・全員必要）',
  parallel_or: 'いずれか承認（同時回覧・1人でOK）',
}

export const REQUEST_STATUS_LABELS: Record<ApprovalRequestStatus, string> = {
  draft: '下書き',
  pending: '承認待ち',
  approved: '承認済み',
  rejected: '却下',
  cancelled: '取下げ',
  published: '投稿済み',
  publish_failed: '投稿失敗',
}

export const STEP_STATUS_LABELS: Record<ApprovalStepStatus, string> = {
  pending: '承認待ち',
  approved: '承認',
  rejected: '却下',
  skipped: 'スキップ',
  delegated: '代理委譲',
}

export interface ApprovalAttachment {
  path: string
  url: string
  filename: string
}

export interface ApprovalContent {
  caption_html?: string
  caption_plain?: string
  attachments?: ApprovalAttachment[]
  schedule_note?: string
  [key: string]: unknown
}

export interface RequestType {
  code: string
  label: string
  description?: string | null
  default_approver_ids: string[]
  default_approval_mode: ApprovalMode
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface SlackChannelBinding {
  id: string
  request_type: string
  label: string
  channel_id: string
  channel_name: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ApprovalStep {
  id: string
  request_id: string
  step_no: number
  assignee_id: string
  original_assignee_id: string
  assignee_email: string
  assignee_name?: string | null
  status: ApprovalStepStatus
  acted_at?: string | null
  comment?: string | null
  notified_at?: string | null
  created_at: string
  updated_at: string
}

export interface ApprovalActionEntry {
  id: string
  request_id: string
  step_id?: string | null
  actor_id: string
  actor_email: string
  actor_name?: string | null
  on_behalf_of_id?: string | null
  action: string
  before_state: Record<string, unknown>
  after_state: Record<string, unknown>
  comment?: string | null
  created_at: string
}

export const ACTION_LABELS: Record<string, string> = {
  submit: '申請',
  resubmit: '再申請',
  approve: '承認',
  reject: '却下',
  return_to_requester: '差戻し',
  return_to_step: 'ステップ差戻し',
  reassign: '承認者差替',
  add_approver: '承認者追加',
  remove_approver: '承認者削除',
  delegate_auto: '代理承認へ自動切替',
  cancel: '取下げ',
  publish_success: 'Slack投稿成功',
  publish_failed: 'Slack投稿失敗',
  notify_failed: '通知失敗',
  viewer_ack: '閲覧確認（押印）',
  delete: '削除',
  attachments_purged: '添付画像の自動削除',
}

export interface ApprovalRequestSummary {
  id: string
  request_type: string
  request_type_label: string
  title: string
  status: ApprovalRequestStatus
  approval_mode: ApprovalMode
  requester_id: string
  requester_email: string
  requester_name?: string | null
  current_step_no: number
  my_step_pending: boolean
  stalled: boolean
  submitted_at?: string | null
  created_at: string
  updated_at: string
}

export interface ApprovalViewer {
  id: string
  viewer_id: string
  viewer_email: string
  viewer_name?: string | null
  acknowledged_at?: string | null
}

export interface ApprovalRequestDetail extends ApprovalRequestSummary {
  content: ApprovalContent
  metadata: Record<string, unknown>
  approved_at?: string | null
  rejected_at?: string | null
  published_at?: string | null
  steps: ApprovalStep[]
  actions: ApprovalActionEntry[]
  can_act: boolean
  can_edit: boolean
  viewers: ApprovalViewer[]
  can_ack: boolean
  can_delete: boolean
}

export interface ApprovalRequestListResponse {
  requests: ApprovalRequestSummary[]
  total: number
}

export interface ApproverInput {
  step_no: number
  assignee_id: string
}

export interface ApprovalRequestCreatePayload {
  request_type: string
  title: string
  content: ApprovalContent
  metadata: Record<string, unknown>
  approval_mode?: ApprovalMode
  approvers: ApproverInput[]
  viewers?: string[]
}

export interface ApprovalRequestSubmitPayload {
  title: string
  content: ApprovalContent
  metadata: Record<string, unknown>
  approval_mode: ApprovalMode
  approvers: ApproverInput[]
  viewers?: string[]
}

export interface ApprovalDelegate {
  id: string
  user_id: string
  user_email?: string | null
  user_name?: string | null
  delegate_id: string
  delegate_email?: string | null
  delegate_name?: string | null
  starts_at: string
  ends_at: string
  note?: string | null
  created_at: string
}

export interface ApprovalDelegateCreatePayload {
  user_id?: string
  delegate_id: string
  starts_at: string
  ends_at: string
  note?: string
}

export interface AttachmentUploadResponse {
  path: string
  url: string
  filename: string
}

export interface PendingCountResponse {
  count: number
}


// =============================================================================
// ダッシュボード
// =============================================================================

export interface ApprovalDashboardDeptRow {
  department_name: string
  draft: number
  pending: number
  approved: number
  rejected: number
  total: number
}

export interface ApprovalDashboardRequestRow {
  id: string
  title: string
  request_type_label: string
  status: ApprovalRequestStatus
  phase: string
  requester_name: string
  department_name: string
  submitted_at?: string | null
  created_at: string
}

export interface ApprovalDashboardResponse {
  by_department: ApprovalDashboardDeptRow[]
  requests: ApprovalDashboardRequestRow[]
  total: number
}
