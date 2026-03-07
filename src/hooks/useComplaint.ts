/**
 * クレーム管理用カスタムフック（SWR版）
 */
'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import {
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  getComplaintMaster,
  getComplaintDashboardSummary,
} from '@/lib/api/complaint'
import type {
  ComplaintListResponse,
  ComplaintDetail,
  ComplaintCreate,
  ComplaintUpdate,
  ComplaintFilterParams,
  ComplaintMasterDataResponse,
  ComplaintDashboardSummary,
} from '@/types/complaint'

/**
 * マスタデータ取得フック
 */
export function useComplaintMaster() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ComplaintMasterDataResponse>(
    '/complaints/master',
    () => getComplaintMaster(),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * クレーム一覧取得フック
 */
export function useComplaints(params: ComplaintFilterParams = {}) {
  const key = `/complaints/list?${JSON.stringify(params)}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<ComplaintListResponse>(
    key,
    () => getComplaints(params),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * クレーム詳細取得フック
 */
export function useComplaint(id: string | null) {
  const key = id ? `/complaints/${id}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<ComplaintDetail>(
    key,
    () => getComplaint(id!),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}

/**
 * クレーム操作フック（作成/更新/削除）
 */
export function useComplaintMutation() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (data: ComplaintCreate): Promise<ComplaintDetail> => {
    try {
      setSaving(true)
      setError(null)
      const result = await createComplaint(data)
      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '作成に失敗しました'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const update = useCallback(async (id: string, data: ComplaintUpdate): Promise<ComplaintDetail> => {
    try {
      setSaving(true)
      setError(null)
      const result = await updateComplaint(id, data)
      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '更新に失敗しました'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      await deleteComplaint(id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '削除に失敗しました'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
  }, [])

  return { create, update, remove, saving, error, reset }
}

/**
 * ダッシュボード用サマリー取得フック
 */
export function useComplaintDashboardSummary(month: string) {
  const key = `/complaints/dashboard-summary?month=${month}`

  const { data, error, isLoading, isValidating, mutate } = useSWR<ComplaintDashboardSummary>(
    key,
    () => getComplaintDashboardSummary(month),
    { dedupingInterval: 60000 }
  )

  return { data: data ?? null, loading: isLoading, validating: isValidating, error: error?.message || null, refetch: mutate }
}
