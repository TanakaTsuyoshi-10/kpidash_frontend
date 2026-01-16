/**
 * 製造分析データ取得カスタムフック
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getManufacturingAnalysis,
  uploadManufacturingData,
} from '@/lib/api/manufacturing'
import type {
  ManufacturingAnalysisResponse,
  ManufacturingUploadResult,
  ManufacturingQueryParams,
} from '@/types/manufacturing'

/**
 * 製造分析データ取得フック
 */
export function useManufacturingAnalysis(params: ManufacturingQueryParams = {}) {
  const [data, setData] = useState<ManufacturingAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getManufacturingAnalysis(params)
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
