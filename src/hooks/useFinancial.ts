/**
 * 財務分析データ取得カスタムフック
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getFinancialAnalysis,
  uploadFinancialData,
  uploadStorePLData,
  getFinanceAnalysisV2,
  getStorePLList,
  getStorePLBySegment,
} from '@/lib/api/financial'
import type {
  FinancialAnalysisData,
  FinancialUploadResult,
  FinancialQueryParams,
  FinancialAnalysisResponseV2,
  StorePLListResponse,
  StorePL,
} from '@/types/financial'

/**
 * 財務分析データ取得フック
 */
export function useFinancialAnalysis(params: FinancialQueryParams = {}) {
  const [data, setData] = useState<FinancialAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getFinancialAnalysis(params)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [params.period_type, params.year, params.month, params.quarter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * 財務データアップロードフック
 */
export function useFinancialUpload() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<FinancialUploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File): Promise<FinancialUploadResult> => {
    try {
      setUploading(true)
      setError(null)
      setResult(null)
      const res = await uploadFinancialData(file)
      setResult(res)
      return res
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'アップロードに失敗しました'
      setError(message)
      throw err
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setError(null)
  }

  return { upload, uploading, result, error, reset }
}

/**
 * 店舗別収支アップロードフック
 */
export function useStorePLUpload() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<FinancialUploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File): Promise<FinancialUploadResult> => {
    try {
      setUploading(true)
      setError(null)
      setResult(null)
      const res = await uploadStorePLData(file)
      setResult(res)
      return res
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'アップロードに失敗しました'
      setError(message)
      throw err
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setError(null)
  }

  return { upload, uploading, result, error, reset }
}

// =============================================================================
// 財務分析V2 フック（展開可能な明細対応）
// =============================================================================

/**
 * 財務分析データ取得フック（明細展開対応）
 */
export function useFinanceAnalysisV2(month: string, periodType: 'monthly' | 'cumulative') {
  const [data, setData] = useState<FinancialAnalysisResponseV2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!month) return

    try {
      setLoading(true)
      setError(null)
      const result = await getFinanceAnalysisV2(month, periodType)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [month, periodType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * 店舗別収支一覧取得フック
 */
export function useStorePLList(
  month: string,
  departmentSlug: string = 'store',
  periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
) {
  const [data, setData] = useState<StorePLListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!month) return

    try {
      setLoading(true)
      setError(null)
      const result = await getStorePLList(month, departmentSlug, periodType)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [month, departmentSlug, periodType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * 店舗収支取得フック（店舗詳細ページ用）
 */
export function useStorePL(segmentId: string, month: string) {
  const [data, setData] = useState<StorePL | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!segmentId || !month) return

    try {
      setLoading(true)
      setError(null)
      const result = await getStorePLBySegment(segmentId, month)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [segmentId, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
