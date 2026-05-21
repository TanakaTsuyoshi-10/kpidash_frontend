/**
 * Slack連携関連の型定義
 * バックエンドスキーマ（app/schemas/slack.py）に準拠
 */

// Slack投稿1件
export interface SlackPost {
  channel: string            // チャンネル名（先頭#付き）
  author: string             // 投稿者の表示名
  text: string               // 本文抜粋
  ts: string                 // Slackメッセージタイムスタンプ
  time_label: string         // 表示用時刻ラベル（例: 10:32 / 昨 18:20）
  permalink: string | null   // Slackパーマリンク（クリックで開く）
}

// Slack投稿一覧レスポンス
export interface SlackPostsResponse {
  new_posts: SlackPost[]       // 本日の新着投稿
  yesterday_posts: SlackPost[] // 昨日の投稿
  is_sample: boolean           // サンプルデータか（Slack連携未設定時true）
}
