/**
 * 月次コメント関連のAPI関数
 */
import { apiClient } from './client'
import type {
  CommentCategory,
  MonthlyComment,
  MonthlyCommentResponse,
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
 * 月次コメントを取得する
 */
export async function getMonthlyComment(
  category: CommentCategory,
  period: string
): Promise<MonthlyComment | null> {
  try {
    const response = await apiClient.get<MonthlyCommentResponse>(
      `/comments/${category}?period=${period}`
    )
    return response.comment
  } catch (err) {
    // 404の場合はnullを返す
    if (err instanceof Error && err.message.includes('404')) {
      return null
    }
    throw err
  }
}

/**
 * 月次コメントを保存する（新規作成または更新）
 */
export async function saveMonthlyComment(
  data: SaveCommentRequest
): Promise<MonthlyComment> {
  try {
    return await apiClient.post<MonthlyComment>('/comments', data)
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('403')) {
        throw new ApiError('このコメントを編集する権限がありません', 403)
      }
    }
    throw err
  }
}

/**
 * 月次コメントを削除する
 */
export async function deleteMonthlyComment(
  category: CommentCategory,
  period: string
): Promise<void> {
  try {
    await apiClient.delete(`/comments/${category}?period=${period}`)
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('403')) {
        throw new ApiError('このコメントを削除する権限がありません', 403)
      }
    }
    throw err
  }
}
