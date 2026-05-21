/**
 * 取締役会資料・議事録関連の型定義
 * バックエンドスキーマ（schemas/board.py）に準拠
 */

// 取締役会資料（リンク）
export interface BoardMaterial {
  label: string
  url: string
}

// 決議・報告トピック区分
export type BoardTopicCategory = '決議' | '報告'

// 決議・報告トピック
export interface BoardTopic {
  category: string // '決議' または '報告'
  title: string
}

// 取締役会 新規登録リクエスト
export interface BoardMeetingCreate {
  meeting_date: string // YYYY-MM-DD
  title: string
  materials: BoardMaterial[]
  topics: BoardTopic[]
  minutes_text?: string | null
}

// 取締役会 更新リクエスト
export interface BoardMeetingUpdate {
  meeting_date?: string
  title?: string
  materials?: BoardMaterial[]
  topics?: BoardTopic[]
  minutes_text?: string | null
}

// 取締役会 詳細
export interface BoardMeeting {
  id: string
  meeting_date: string
  title: string
  materials: BoardMaterial[]
  topics: BoardTopic[]
  minutes_text: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// 取締役会 一覧アイテム（議事録本文は含まない）
export interface BoardMeetingListItem {
  id: string
  meeting_date: string
  title: string
  topics: BoardTopic[]
}

// 取締役会 一覧レスポンス
export interface BoardMeetingListResponse {
  meetings: BoardMeetingListItem[]
  total: number
}
