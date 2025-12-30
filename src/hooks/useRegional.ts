/**
 * 地区別分析のデータ取得フック
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getRegions,
  getStoreMappings,
  initializeStoreMappings,
  getRegionalSummary,
} from '@/lib/api/regional'
import type {
  Region,
  StoreMapping,
  RegionalSummaryResponse,
  PeriodType,
} from '@/types/regional'

/**
 * 地区一覧を取得するフック
 */
export function useRegions() {
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getRegions()
      setRegions(result.regions)
    } catch (err) {
      setError(err instanceof Error ? err.message : '地区一覧の取得に失敗しました')
      setRegions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { regions, loading, error, refetch: fetchData }
}

/**
 * 店舗マッピングを取得するフック
 */
export function useStoreMappings() {
  const [mappings, setMappings] = useState<StoreMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getStoreMappings()
      setMappings(result.mappings)
    } catch (err) {
      setError(err instanceof Error ? err.message : '店舗マッピングの取得に失敗しました')
      setMappings([])
    } finally {
      setLoading(false)
    }
  }, [])

  const initialize = useCallback(async () => {
    try {
      setInitializing(true)
      setError(null)
      const result = await initializeStoreMappings()
      setMappings(result.mappings)
    } catch (err) {
      setError(err instanceof Error ? err.message : '店舗マッピングの初期化に失敗しました')
      throw err
    } finally {
      setInitializing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { mappings, loading, initializing, error, refetch: fetchData, initialize }
}

/**
 * 地区別集計を取得するフック
 */
export function useRegionalSummary(month: string, periodType: PeriodType = 'monthly') {
  const [data, setData] = useState<RegionalSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!month) return

    try {
      setLoading(true)
      setError(null)
      const result = await getRegionalSummary(month, periodType)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '地区別集計の取得に失敗しました')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [month, periodType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
