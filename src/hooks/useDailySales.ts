/**
 * 日次販売分析のデータ取得フック（SWR版）
 */
'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import {
  getDailySalesSummary,
  getHourlySales,
  getDailyTrend,
  uploadReceiptJournal,
} from '@/lib/api/daily-sales'
import type {
  DailySalesSummaryResponse,
  HourlySalesResponse,
  DailyTrendResponse,
  ReceiptJournalUploadResult,
} from '@/types/daily-sales'

/**
 * 日別×店舗サマリーを取得するフック
 */
export function useDailySalesSummary(
  month: string,
  departmentSlug: string = 'store',
) {
  const key = `/daily-sales/summary?month=${month}&dept=${departmentSlug}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<DailySalesSummaryResponse>(
    key,
    () => getDailySalesSummary(month, departmentSlug),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 時間帯別ヒートマップデータを取得するフック
 */
export function useHourlySales(
  date: string,
  departmentSlug: string = 'store',
) {
  const key = date ? `/daily-sales/hourly?date=${date}&dept=${departmentSlug}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<HourlySalesResponse>(
    key,
    () => getHourlySales(date, departmentSlug),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 日次推移データを取得するフック
 */
export function useDailyTrend(
  month: string,
  segmentId?: string,
  departmentSlug: string = 'store',
) {
  const key = `/daily-sales/trend?month=${month}&segment=${segmentId ?? ''}&dept=${departmentSlug}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<DailyTrendResponse>(
    key,
    () => getDailyTrend(month, segmentId, departmentSlug),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * レシートジャーナルアップロードフック
 */
export function useReceiptJournalUpload() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ReceiptJournalUploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File) => {
    try {
      setUploading(true)
      setError(null)
      setResult(null)
      const res = await uploadReceiptJournal(file)
      setResult(res)
      return res
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'アップロードに失敗しました'
      setError(msg)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { upload, uploading, result, error, reset }
}
