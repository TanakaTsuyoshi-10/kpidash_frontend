/**
 * 月次コメントの型定義
 */

// コメントのカテゴリ
export type CommentCategory = 'store' | 'ecommerce' | 'finance' | 'manufacturing' | 'regional'

// コメントデータ
export interface MonthlyComment {
  id?: string
  category: CommentCategory
  period: string  // "YYYY-MM-01" 形式
  comment: string
  segment_id?: string | null       // 店舗ID（店舗詳細のコメントのみ。部門レベルはnull）
  created_by?: string | null       // 作成者ユーザーID
  created_by_email?: string | null // 作成者メールアドレス
  updated_by?: string | null       // 最終編集者ユーザーID
  updated_by_email?: string | null // 最終編集者メールアドレス
  created_at?: string
  updated_at?: string
}

// 複数コメント取得レスポンス
export interface MonthlyCommentsResponse {
  comments: MonthlyComment[]
}

// コメント保存リクエスト
export interface SaveCommentRequest {
  category: CommentCategory
  period: string
  comment: string
  segment_id?: string | null
}

// コメント更新リクエスト
export interface UpdateCommentRequest {
  comment: string
}

// 編集履歴エントリ
export interface CommentEditHistoryEntry {
  id: string
  previous_comment: string
  edited_by?: string | null
  edited_by_email?: string | null
  edited_at?: string
}

// 編集履歴レスポンス
export interface CommentEditHistoryResponse {
  history: CommentEditHistoryEntry[]
}
