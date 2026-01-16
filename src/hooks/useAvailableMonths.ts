/**
 * 利用可能な月一覧を取得するフック
 */
import { useState, useEffect } from 'react'
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
  const [months, setMonths] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMonths = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({ department_slug: departmentSlug })
        const result = await apiClient.get<AvailableMonthsResponse>(
          `/products/available-months?${params.toString()}`
        )
        setMonths(result.months || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        // エラー時はフォールバックとして過去12ヶ月を使用
        setMonths(generateFallbackMonths())
      } finally {
        setLoading(false)
      }
    }
    fetchMonths()
  }, [departmentSlug])

  return { months, loading, error }
}
