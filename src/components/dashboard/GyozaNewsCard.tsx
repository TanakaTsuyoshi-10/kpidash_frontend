/**
 * 餃子ニュース・業界情報カード
 *
 * ダッシュボード最上部に全幅で配置するカード。
 * Google ニュースから取得した餃子関連の最新ニュースを横並びで表示する。
 * design-demo/dashboard-demo.html の「餃子ニュース欄」の見た目に準拠。
 */
'use client'

import { Newspaper, Rss } from 'lucide-react'
import { useGyozaNews } from '@/hooks/useNews'
import { cn } from '@/lib/utils'
import type { NewsItem } from '@/types/news'

// ダッシュボード最上部に表示する記事数
const DISPLAY_COUNT = 4

// Google ニュース検索ページ（「もっと見る」リンク先）
const GOOGLE_NEWS_SEARCH_URL =
  'https://news.google.com/search?q=%E9%A4%83%E5%AD%90&hl=ja&gl=JP&ceid=JP:ja'

// カテゴリタグの配色（カテゴリ未指定時は表示位置で巡回させる）
const TAG_STYLES = [
  'text-orange-600 bg-orange-100',
  'text-green-600 bg-green-100',
  'text-blue-600 bg-blue-100',
  'text-purple-600 bg-purple-100',
] as const

const DEFAULT_TAG_LABEL = '餃子ニュース'

/**
 * 公開日時を「M月D日」形式に整形する。
 */
function formatPublishedDate(published: string | null): string | null {
  if (!published) return null
  const date = new Date(published)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

interface NewsCellProps {
  item: NewsItem
  index: number
}

function NewsCell({ item, index }: NewsCellProps) {
  const tagStyle = TAG_STYLES[index % TAG_STYLES.length]
  const tagLabel = item.category?.trim() || DEFAULT_TAG_LABEL
  const publishedDate = formatPublishedDate(item.published_at)

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 hover:bg-orange-50/50 transition-colors cursor-pointer"
    >
      <span
        className={cn(
          'text-[10px] font-semibold px-1.5 py-0.5 rounded',
          tagStyle
        )}
      >
        {tagLabel}
      </span>
      <p className="text-sm font-semibold leading-snug mt-2 line-clamp-3 text-gray-900">
        {item.title}
      </p>
      <p className="text-xs text-gray-400 mt-2">
        {item.source}
        {publishedDate ? ` ・ ${publishedDate}` : ''}
      </p>
    </a>
  )
}

function NewsCellSkeleton() {
  return (
    <div className="p-4">
      <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
      <div className="mt-2 space-y-1.5">
        <div className="h-3.5 w-full rounded bg-gray-100 animate-pulse" />
        <div className="h-3.5 w-4/5 rounded bg-gray-100 animate-pulse" />
      </div>
      <div className="h-3 w-24 rounded bg-gray-100 animate-pulse mt-2" />
    </div>
  )
}

export function GyozaNewsCard() {
  const { items, loading, error } = useGyozaNews(DISPLAY_COUNT)

  const visibleItems = items.slice(0, DISPLAY_COUNT)
  const showEmpty = !loading && !error && visibleItems.length === 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-orange-50">
        <h2 className="font-semibold flex items-center gap-2 text-orange-800">
          <Newspaper className="h-5 w-5" />
          餃子ニュース・業界情報
        </h2>
        <span className="flex items-center gap-1 text-[11px] text-orange-600">
          <Rss className="h-3.5 w-3.5" />
          Google ニュース ・ 自動更新
        </span>
      </div>

      {/* 本体 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {Array.from({ length: DISPLAY_COUNT }).map((_, i) => (
            <NewsCellSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          ニュースを取得できませんでした
        </div>
      ) : showEmpty ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          現在表示できるニュースはありません
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {visibleItems.map((item, i) => (
            <NewsCell key={item.link} item={item} index={i} />
          ))}
        </div>
      )}

      {/* フッター */}
      <div className="px-5 py-2 border-t border-gray-100 text-center bg-gray-50/50">
        <a
          href={GOOGLE_NEWS_SEARCH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-green-700 hover:underline cursor-pointer"
        >
          餃子ニュースをもっと見る
        </a>
      </div>
    </div>
  )
}
