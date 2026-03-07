/**
 * 利用可能な月一覧を取得するフック（SWR版）
 */
'use client'

import useSWR from 'swr'
import { format, subMonths } from 'date-fns'
import { apiClient } from '@/lib/api/client'

export interface AvailableMonthsResponse {
  months: string[]  // "2025-11-01" 形式の配列
}

// フォールバック用: 過去12ヶ月を生成
function generateFallbackMonths(): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i)
    return format(date, 'yyyy-MM-01')
  })
}

export function useAvailableMonths(departmentSlug: string = 'store') {
  const params = new URLSearchParams({ department_slug: departmentSlug })
  const key = `/products/available-months?${params}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<AvailableMonthsResponse>(
    key,
    () => apiClient.get<AvailableMonthsResponse>(`/products/available-months?${params.toString()}`),
    {
      dedupingInterval: 60000,
      onError: () => {
        // エラー時はSWRのキャッシュにフォールバックデータをセット
        mutate({ months: generateFallbackMonths() }, false)
      },
    }
  )

  return { months: data?.months ?? [], loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}
