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
  created_by?: string | null       // 作成者ユーザーID
  created_by_email?: string | null // 作成者メールアドレス
  is_owner?: boolean               // 現在のユーザーが作成者か
  created_at?: string
  updated_at?: string
}

// コメント取得レスポンス
export interface MonthlyCommentResponse {
  comment: MonthlyComment | null
}

// コメント保存リクエスト
export interface SaveCommentRequest {
  category: CommentCategory
  period: string
  comment: string
}
