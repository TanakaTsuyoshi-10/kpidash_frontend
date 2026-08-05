/**
 * 月次コメント関連のAPI関数
 */
import { apiClient } from './client'
import type {
  CommentCategory,
  MonthlyComment,
  MonthlyCommentsResponse,
  CommentEditHistoryEntry,
  CommentEditHistoryResponse,
  SaveCommentRequest,
} from '@/types/comment'

// APIエラークラス
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

/**
 * 月次コメント一覧を取得する
 */
export async function getMonthlyComments(
  category: CommentCategory,
  period: string,
  segmentId?: string
): Promise<MonthlyComment[]> {
  try {
    const params = new URLSearchParams({ period })
    if (segmentId) params.append('segment_id', segmentId)
    const response = await apiClient.get<MonthlyCommentsResponse>(
      `/comments/${category}?${params.toString()}`
    )
    return response.comments ?? []
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      return []
    }
    throw err
  }
}

/**
 * 新規コメントを追加する
 */
export async function addComment(
  data: SaveCommentRequest
): Promise<MonthlyComment> {
  return await apiClient.post<MonthlyComment>('/comments', data)
}

/**
 * コメントを編集する
 */
export async function updateComment(
  commentId: string,
  comment: string
): Promise<MonthlyComment> {
  return await apiClient.put<MonthlyComment>(`/comments/${commentId}`, { comment })
}

/**
 * コメントを削除する
 */
export async function deleteComment(
  commentId: string
): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`)
}

/**
 * コメントの編集履歴を取得する
 */
export async function getCommentHistory(
  commentId: string
): Promise<CommentEditHistoryEntry[]> {
  const response = await apiClient.get<CommentEditHistoryResponse>(
    `/comments/${commentId}/history`
  )
  return response.history ?? []
}
