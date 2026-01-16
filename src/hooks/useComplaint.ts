/**
 * クレーム管理用カスタムフック
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [data, setData] = useState<ComplaintMasterDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getComplaintMaster()
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'マスタデータの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * クレーム一覧取得フック
 */
export function useComplaints(params: ComplaintFilterParams = {}) {
  const [data, setData] = useState<ComplaintListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getComplaints(params)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [
    params.status,
    params.department_type,
    params.complaint_type,
    params.from_date,
    params.to_date,
    params.search,
    params.page,
    params.page_size,
  ])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * クレーム詳細取得フック
 */
export function useComplaint(id: string | null) {
  const [data, setData] = useState<ComplaintDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setData(null)
      return
    }

    let cancelled = false
    const complaintId = id

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const result = await getComplaint(complaintId)
        if (!cancelled) {
          setData(result)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'データの取得に失敗しました'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [id])

  return { data, loading, error }
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
  const [data, setData] = useState<ComplaintDashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getComplaintDashboardSummary(month)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'サマリーの取得に失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
