/**
 * 餃子ニュース関連の型定義
 * バックエンドスキーマ（app/schemas/news.py）に準拠
 */

// ニュース記事1件
export interface NewsItem {
  title: string
  link: string
  source: string
  published_at: string | null
  category: string | null
}

// 餃子ニュースレスポンス
export interface NewsResponse {
  items: NewsItem[]
}
