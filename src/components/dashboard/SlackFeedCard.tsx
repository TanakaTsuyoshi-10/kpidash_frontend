/**
 * Slack投稿カード
 *
 * ダッシュボード右カラム用。Bot が参加する全チャンネルの
 * 「新着（本日）」「昨日」の投稿を2区分で表示する。
 * design-demo/dashboard-demo.html の「Slack 投稿」カードに準拠。
 */
'use client'

import { MessageSquare } from 'lucide-react'
import { useSlackPosts } from '@/hooks/useSlack'
import type { SlackPost } from '@/types/slack'

/** Slackワークスペースのトップ（permalink が無い投稿のフォールバック先） */
const SLACK_APP_URL = 'https://slack.com/app_redirect'

/**
 * 投稿1件の行
 */
function PostRow({ post }: { post: SlackPost }) {
  const clickable = Boolean(post.permalink)

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-violet-600 truncate">
          {post.channel}
        </span>
        <span className="text-[11px] text-gray-400 shrink-0">
          {post.time_label}
        </span>
      </div>
      <p className="text-xs text-gray-700 mt-0.5 line-clamp-2">
        <b>{post.author}</b> {post.text}
      </p>
    </>
  )

  if (clickable) {
    return (
      <li className="hover:bg-gray-50">
        <a
          href={post.permalink ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-5 py-2.5"
        >
          {content}
        </a>
      </li>
    )
  }

  return <li className="px-5 py-2.5 hover:bg-gray-50">{content}</li>
}

/**
 * 区分見出し（新着 / 昨日）
 */
function SectionLabel({
  label,
  tone,
}: {
  label: string
  tone: 'new' | 'past'
}) {
  const dotClass = tone === 'new' ? 'bg-violet-500' : 'bg-gray-400'
  const textClass = tone === 'new' ? 'text-violet-700' : 'text-gray-500'
  return (
    <p className={`text-xs font-semibold flex items-center gap-1 ${textClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </p>
  )
}

/**
 * 投稿リスト or 0件メッセージ
 */
function PostList({ posts }: { posts: SlackPost[] }) {
  if (posts.length === 0) {
    return (
      <p className="px-5 py-3 text-[11px] text-gray-400">投稿はありません</p>
    )
  }
  return (
    <ul className="divide-y divide-gray-100 mt-1">
      {posts.map((post) => (
        <PostRow key={`${post.channel}-${post.ts}`} post={post} />
      ))}
    </ul>
  )
}

/**
 * ローディング時のスケルトン行
 */
function SkeletonRows({ count }: { count: number }) {
  return (
    <ul className="divide-y divide-gray-100 mt-1">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="px-5 py-2.5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
            <div className="h-3 w-8 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="h-3 w-full rounded bg-gray-200 animate-pulse mt-1.5" />
        </li>
      ))}
    </ul>
  )
}

export function SlackFeedCard() {
  const { data, loading, error } = useSlackPosts()

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-violet-50">
        <h2 className="font-semibold flex items-center gap-2 text-violet-800">
          <MessageSquare className="h-5 w-5" />
          Slack 投稿
        </h2>
        <span className="text-[11px] text-violet-600">
          {data?.is_sample ? 'サンプル表示' : 'Bot参加チャンネル'}
        </span>
      </div>

      {loading && (
        <>
          <div className="px-5 pt-3">
            <SectionLabel label="新着（本日）" tone="new" />
          </div>
          <SkeletonRows count={3} />
          <div className="px-5 pt-3 border-t border-gray-100">
            <SectionLabel label="昨日" tone="past" />
          </div>
          <SkeletonRows count={2} />
        </>
      )}

      {!loading && error && (
        <div className="px-5 py-6 text-center text-xs text-gray-400">
          Slack投稿を取得できませんでした
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* 新着（本日） */}
          <div className="px-5 pt-3">
            <SectionLabel label="新着（本日）" tone="new" />
          </div>
          <PostList posts={data.new_posts} />

          {/* 昨日 */}
          <div className="px-5 pt-3 border-t border-gray-100">
            <SectionLabel label="昨日" tone="past" />
          </div>
          <PostList posts={data.yesterday_posts} />
        </>
      )}

      {/* フッター */}
      <div className="px-5 py-2.5 border-t border-gray-100 text-center bg-gray-50/50">
        <a
          href={SLACK_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-green-700 hover:underline"
        >
          Slackで開く
        </a>
      </div>
    </div>
  )
}
