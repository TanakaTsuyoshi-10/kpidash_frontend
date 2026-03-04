/**
 * 日次販売分析のデータ取得フック
 */
import { useState, useEffect, useCallback } from 'react'
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
  const [data, setData] = useState<DailySalesSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getDailySalesSummary(month, departmentSlug)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [month, departmentSlug])

  return { data, loading, error }
}

/**
 * 時間帯別ヒートマップデータを取得するフック
 */
export function useHourlySales(
  date: string,
  departmentSlug: string = 'store',
) {
  const [data, setData] = useState<HourlySalesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!date) {
      setLoading(false)
      return
    }
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getHourlySales(date, departmentSlug)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [date, departmentSlug])

  return { data, loading, error }
}

/**
 * 日次推移データを取得するフック
 */
export function useDailyTrend(
  month: string,
  segmentId?: string,
  departmentSlug: string = 'store',
) {
  const [data, setData] = useState<DailyTrendResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getDailyTrend(month, segmentId, departmentSlug)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [month, segmentId, departmentSlug])

  return { data, loading, error }
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
