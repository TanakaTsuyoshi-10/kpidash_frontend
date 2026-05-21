/**
 * 取締役会資料・議事録用カスタムフック（SWR版）
 */
'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import {
  getBoardMeetings,
  getBoardMeeting,
  createBoardMeeting,
  updateBoardMeeting,
  deleteBoardMeeting,
} from '@/lib/api/board'
import type {
  BoardMeeting,
  BoardMeetingCreate,
  BoardMeetingUpdate,
  BoardMeetingListResponse,
} from '@/types/board'

/**
 * 取締役会一覧取得フック
 */
export function useBoardMeetings(enabled: boolean = true) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<BoardMeetingListResponse>(
    enabled ? '/board/list' : null,
    () => getBoardMeetings(),
    { dedupingInterval: 60000 }
  )

  return {
    data: data ?? null,
    loading: isLoading,
    validating: isValidating,
    error: error?.message || null,
    refetch: mutate,
  }
}

/**
 * 取締役会詳細取得フック
 */
export function useBoardMeeting(id: string | null) {
  const key = id ? `/board/${id}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<BoardMeeting>(
    key,
    () => getBoardMeeting(id!),
    { dedupingInterval: 60000 }
  )

  return {
    data: data ?? null,
    loading: isLoading,
    validating: isValidating,
    error: error?.message || null,
    refetch: mutate,
  }
}

/**
 * 取締役会操作フック（作成/更新/削除）
 */
export function useBoardMutation() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (data: BoardMeetingCreate): Promise<BoardMeeting> => {
    try {
      setSaving(true)
      setError(null)
      return await createBoardMeeting(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '作成に失敗しました'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const update = useCallback(async (id: string, data: BoardMeetingUpdate): Promise<BoardMeeting> => {
    try {
      setSaving(true)
      setError(null)
      return await updateBoardMeeting(id, data)
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
      await deleteBoardMeeting(id)
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
