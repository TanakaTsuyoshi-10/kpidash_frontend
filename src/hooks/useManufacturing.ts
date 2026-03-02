/**
 * 製造分析データ取得カスタムフック（SWR版）
 */
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  getManufacturingAnalysis,
  uploadManufacturingData,
} from '@/lib/api/manufacturing'
import type {
  ManufacturingAnalysisResponse,
  ManufacturingUploadResult,
  ManufacturingQueryParams,
} from '@/types/manufacturing'

function buildManufacturingKey(params: ManufacturingQueryParams) {
  const p = new URLSearchParams()
  if (params.period_type) p.append('period_type', params.period_type)
  if (params.year !== undefined) p.append('year', params.year.toString())
  if (params.month !== undefined) p.append('month', params.month.toString())
  if (params.quarter !== undefined) p.append('quarter', params.quarter.toString())
  return `/api/v1/manufacturing${p.toString() ? `?${p}` : ''}`
}

/**
 * 製造分析データ取得フック
 */
export function useManufacturingAnalysis(params: ManufacturingQueryParams = {}) {
  const key = buildManufacturingKey(params)

  const { data, error, isLoading, isValidating, mutate } = useSWR<ManufacturingAnalysisResponse>(
    key,
    () => getManufacturingAnalysis(params),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 製造データアップロードフック
 */
export function useManufacturingUpload() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ManufacturingUploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File): Promise<ManufacturingUploadResult> => {
    try {
      setUploading(true)
      setError(null)
      setResult(null)
      const res = await uploadManufacturingData(file)
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
