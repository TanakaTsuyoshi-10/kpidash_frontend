/**
 * 目標値管理のフック（SWR版）
 */
'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import {
  getTargetMatrix,
  createTarget,
  updateTarget,
  deleteTarget,
  bulkCreateTargets,
  getTargetOverview,
  getStoreTargets,
  saveStoreTargets,
  getFinancialTargets,
  saveFinancialTargets,
  getEcommerceTargets,
  saveEcommerceTargets,
} from '@/lib/api/target'
import type {
  TargetMatrixResponse,
  TargetBulkResponse,
  CellChange,
  TargetOverview,
  StoreTargetBulkInput,
  FinancialTargetResponse,
  FinancialTargetInput,
  EcommerceTargetResponse,
  EcommerceTargetInput,
  TargetSettingResult,
} from '@/types/target'

/**
 * 目標値マトリックスを取得するフック
 */
export function useTargetMatrix(departmentSlug: string, month: string) {
  const key = `/targets/matrix?dept=${departmentSlug}&month=${month}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<TargetMatrixResponse>(
    key,
    () => getTargetMatrix(departmentSlug, month),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 目標値の保存処理を行うフック
 */
export function useTargetMutations() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 単一セルの保存
   */
  const saveCell = useCallback(
    async (change: CellChange, month: string): Promise<number | null> => {
      setSaving(true)
      setError(null)

      try {
        if (change.value === null) {
          // 値がnullの場合は削除
          if (change.targetId) {
            await deleteTarget(change.targetId)
          }
          return null
        } else if (change.targetId) {
          // 既存の目標値を更新
          const result = await updateTarget(change.targetId, { value: change.value })
          return result.id
        } else {
          // 新規登録
          const result = await createTarget({
            segment_id: change.segmentId,
            kpi_id: change.kpiId,
            month,
            value: change.value,
          })
          return result.id
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存に失敗しました')
        throw err
      } finally {
        setSaving(false)
      }
    },
    []
  )

  /**
   * 一括保存
   */
  const saveBulk = useCallback(
    async (
      changes: CellChange[],
      month: string
    ): Promise<TargetBulkResponse> => {
      setSaving(true)
      setError(null)

      try {
        // 削除が必要なセル（元の値があり、新しい値がnull）
        const deletions = changes.filter(
          (c) => c.targetId && c.value === null && c.originalValue !== null
        )

        // 作成・更新が必要なセル（新しい値がある）
        const upserts = changes.filter((c) => c.value !== null)

        // 削除処理
        for (const del of deletions) {
          if (del.targetId) {
            await deleteTarget(del.targetId)
          }
        }

        // 一括登録（値があるもののみ）
        if (upserts.length === 0) {
          return {
            success: true,
            created_count: 0,
            updated_count: 0,
            errors: [],
          }
        }

        const result = await bulkCreateTargets({
          targets: upserts.map((c) => ({
            segment_id: c.segmentId,
            kpi_id: c.kpiId,
            month,
            value: c.value!,
          })),
        })

        return result
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存に失敗しました')
        throw err
      } finally {
        setSaving(false)
      }
    },
    []
  )

  return { saving, error, saveCell, saveBulk }
}

// =============================================================================
// 目標設定 新フック
// =============================================================================

/**
 * 目標概要を取得するフック
 */
export function useTargetOverview(month: string) {
  const key = `/targets/overview?month=${month}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<TargetOverview>(
    key,
    () => getTargetOverview(month),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 店舗目標を取得するフック
 */
export function useStoreTargets(month: string) {
  const key = `/targets/store?month=${month}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<TargetMatrixResponse>(
    key,
    () => getStoreTargets(month),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 店舗目標の保存フック
 */
export function useStoreTargetMutation() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(async (data: StoreTargetBulkInput): Promise<TargetSettingResult> => {
    setSaving(true)
    setError(null)
    try {
      const result = await saveStoreTargets(data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  return { save, saving, error }
}

/**
 * 財務目標を取得するフック
 */
export function useFinancialTargets(month: string) {
  const key = `/targets/financial?month=${month}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<FinancialTargetResponse>(
    key,
    () => getFinancialTargets(month),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 財務目標の保存フック
 */
export function useFinancialTargetMutation() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(async (data: FinancialTargetInput): Promise<TargetSettingResult> => {
    setSaving(true)
    setError(null)
    try {
      const result = await saveFinancialTargets(data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  return { save, saving, error }
}

/**
 * 通販目標を取得するフック
 */
export function useEcommerceTargets(month: string) {
  const key = `/targets/ecommerce?month=${month}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<EcommerceTargetResponse>(
    key,
    () => getEcommerceTargets(month),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * 通販目標の保存フック
 */
export function useEcommerceTargetMutation() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(async (data: EcommerceTargetInput): Promise<TargetSettingResult> => {
    setSaving(true)
    setError(null)
    try {
      const result = await saveEcommerceTargets(data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  return { save, saving, error }
}
