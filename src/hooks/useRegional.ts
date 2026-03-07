/**
 * 地区別分析のデータ取得フック（SWR版）
 */
'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import {
  getRegions,
  getStoreMappings,
  initializeStoreMappings,
  getRegionalSummary,
  getRegionalTargets,
} from '@/lib/api/regional'
import type {
  Region,
  StoreMapping,
  RegionalSummaryResponse,
  RegionalTarget,
  SaveRegionalTargetRequest,
  PeriodType,
} from '@/types/regional'

/**
 * 地区一覧を取得するフック
 */
export function useRegions() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ regions: Region[] }>(
    '/regional/regions',
    () => getRegions(),
    { dedupingInterval: 60000 }
  )

  return { regions: data?.regions ?? [], loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 店舗マッピングを取得するフック
 */
export function useStoreMappings() {
  const [initializing, setInitializing] = useState(false)

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ mappings: StoreMapping[] }>(
    '/regional/store-mappings',
    () => getStoreMappings(),
    { dedupingInterval: 60000 }
  )

  const initialize = useCallback(async () => {
    try {
      setInitializing(true)
      const result = await initializeStoreMappings()
      mutate({ mappings: result.mappings }, false)
    } catch (err) {
      throw err
    } finally {
      setInitializing(false)
    }
  }, [mutate])

  return { mappings: data?.mappings ?? [], loading: isLoading, validating: isValidating, initializing, error: error?.message || null, refetch: mutate, initialize }
}

/**
 * 地区別集計を取得するフック
 */
export function useRegionalSummary(month: string, periodType: PeriodType = 'monthly') {
  const key = month ? `/regional/summary?month=${month}&period_type=${periodType}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<RegionalSummaryResponse>(
    key,
    () => getRegionalSummary(month, periodType),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 地区別目標を取得するフック（読み取り専用: 目標は店舗目標から自動集計）
 */
export function useRegionalTargets(month: string) {
  const key = month ? `/regional/targets?month=${month}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ targets: RegionalTarget[] }>(
    key,
    () => getRegionalTargets(month),
    { dedupingInterval: 60000 }
  )

  const save = useCallback(async (_targetData: SaveRegionalTargetRequest[]) => {
    throw new Error('地区別目標の直接設定は廃止されました。目標設定ページから店舗別に設定してください。')
  }, [])

  return { targets: data?.targets ?? [], loading: isLoading, validating: isValidating, saving: false, error: error?.message || null, save, refetch: mutate }
}
