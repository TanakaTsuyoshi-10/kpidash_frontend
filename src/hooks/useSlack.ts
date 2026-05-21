/**
 * Slack連携用カスタムフック（SWR版）
 */
'use client'

import useSWR from 'swr'
import { fetchSlackPosts } from '@/lib/api/slack'
import type { SlackPostsResponse } from '@/types/slack'

/**
 * Slack投稿（本日の新着・昨日）取得フック
 *
 * バックエンド側で5〜10分キャッシュされるため、
 * フロント側のdedupingIntervalも長めに設定する。
 */
export function useSlackPosts() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<SlackPostsResponse>(
    '/api/v1/slack/posts',
    () => fetchSlackPosts(),
    { dedupingInterval: 300000 }
  )

  return {
    data: data ?? null,
    loading: isLoading,
    validating: isValidating,
    error: error?.message || null,
    refetch: mutate,
  }
}
