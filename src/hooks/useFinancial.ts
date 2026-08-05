/**
 * 財務分析データ取得カスタムフック（SWR版）
 */
'use client'

import { useState } from 'react'
import useSWR from 'swr'
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

function buildFinancialKey(params: FinancialQueryParams) {
  const p = new URLSearchParams()
  if (params.period_type) p.append('period_type', params.period_type)
  if (params.year !== undefined) p.append('year', params.year.toString())
  if (params.month !== undefined) p.append('month', params.month.toString())
  if (params.quarter !== undefined) p.append('quarter', params.quarter.toString())
  return `/api/v1/dashboard/financial${p.toString() ? `?${p}` : ''}`
}

/**
 * 財務分析データ取得フック
 */
export function useFinancialAnalysis(params: FinancialQueryParams = {}) {
  const key = buildFinancialKey(params)

  const { data, error, isLoading, isValidating, mutate } = useSWR<FinancialAnalysisData>(
    key,
    () => getFinancialAnalysis(params),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
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
  const key = month
    ? `/api/v1/finance/analysis?month=${month}&period_type=${periodType}`
    : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<FinancialAnalysisResponseV2>(
    key,
    () => getFinanceAnalysisV2(month, periodType),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 店舗別収支一覧取得フック
 */
export function useStorePLList(
  month: string,
  departmentSlug: string = 'store',
  periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
) {
  const key = month
    ? `/api/v1/finance/store-pl?month=${month}&department_slug=${departmentSlug}&period_type=${periodType}`
    : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<StorePLListResponse>(
    key,
    () => getStorePLList(month, departmentSlug, periodType),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 店舗収支取得フック（店舗詳細ページ用）
 */
export function useStorePL(
  segmentId: string,
  month: string,
  periodType: 'monthly' | 'cumulative' = 'monthly'
) {
  const key = segmentId && month
    ? `/api/v1/finance/store-pl/${segmentId}?month=${month}&period_type=${periodType}`
    : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<StorePL>(
    key,
    () => getStorePLBySegment(segmentId, month, periodType),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}
