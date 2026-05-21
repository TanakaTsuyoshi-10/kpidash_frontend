/**
 * 餃子ニュース用カスタムフック（SWR版）
 */
'use client'

import useSWR from 'swr'
import { fetchGyozaNews } from '@/lib/api/news'
import type { NewsResponse } from '@/types/news'

/**
 * 餃子ニュース取得フック
 *
 * バックエンド側で1時間キャッシュされるため、フロント側は長めの
 * dedupingInterval で再取得を抑制する。
 *
 * @param limit 取得件数（デフォルト8件）
 */
export function useGyozaNews(limit = 8) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<NewsResponse>(
    `/news/gyoza?limit=${limit}`,
    () => fetchGyozaNews(limit),
    {
      dedupingInterval: 3600000, // 1時間
      revalidateOnFocus: false,
    }
  )

  return {
    items: data?.items ?? [],
    loading: isLoading,
    validating: isValidating,
    error: error?.message ?? null,
    refetch: mutate,
  }
}
