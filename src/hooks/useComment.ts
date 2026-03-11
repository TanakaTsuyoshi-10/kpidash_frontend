/**
 * 月次コメント用カスタムフック（複数コメント対応）
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getMonthlyComments,
  addComment as apiAddComment,
  updateComment as apiUpdateComment,
  deleteComment as apiDeleteComment,
  getCommentHistory,
} from '@/lib/api/comment'
import type { CommentCategory, MonthlyComment, CommentEditHistoryEntry } from '@/types/comment'

interface UseMonthlyCommentsReturn {
  comments: MonthlyComment[]
  loading: boolean
  saving: boolean
  error: string | null
  addComment: (text: string) => Promise<void>
  updateComment: (id: string, text: string) => Promise<void>
  removeComment: (id: string) => Promise<void>
  fetchHistory: (id: string) => Promise<CommentEditHistoryEntry[]>
}

export function useMonthlyComments(
  category: CommentCategory,
  period: string
): UseMonthlyCommentsReturn {
  const [comments, setComments] = useState<MonthlyComment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // コメント一覧を取得
  useEffect(() => {
    let cancelled = false

    async function fetchComments() {
      if (!period) return

      try {
        setLoading(true)
        setError(null)
        const data = await getMonthlyComments(category, period)
        if (!cancelled) {
          setComments(data)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('コメント取得エラー:', err)
          setError(err instanceof Error ? err.message : 'コメントの取得に失敗しました')
          setComments([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchComments()

    return () => {
      cancelled = true
    }
  }, [category, period])

  // コメントを追加
  const addComment = useCallback(async (text: string) => {
    if (!period || !text.trim()) return

    try {
      setSaving(true)
      setError(null)
      const newComment = await apiAddComment({
        category,
        period,
        comment: text,
      })
      setComments(prev => [...prev, newComment])
    } catch (err) {
      console.error('コメント追加エラー:', err)
      setError(err instanceof Error ? err.message : 'コメントの追加に失敗しました')
      throw err
    } finally {
      setSaving(false)
    }
  }, [category, period])

  // コメントを編集
  const updateComment = useCallback(async (id: string, text: string) => {
    try {
      setSaving(true)
      setError(null)
      const updated = await apiUpdateComment(id, text)
      setComments(prev => prev.map(c => c.id === id ? updated : c))
    } catch (err) {
      console.error('コメント編集エラー:', err)
      setError(err instanceof Error ? err.message : 'コメントの編集に失敗しました')
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  // コメントを削除
  const removeComment = useCallback(async (id: string) => {
    try {
      setSaving(true)
      setError(null)
      await apiDeleteComment(id)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('コメント削除エラー:', err)
      setError(err instanceof Error ? err.message : 'コメントの削除に失敗しました')
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  // 編集履歴を取得
  const fetchHistory = useCallback(async (id: string): Promise<CommentEditHistoryEntry[]> => {
    try {
      return await getCommentHistory(id)
    } catch (err) {
      console.error('編集履歴取得エラー:', err)
      return []
    }
  }, [])

  return {
    comments,
    loading,
    saving,
    error,
    addComment,
    updateComment,
    removeComment,
    fetchHistory,
  }
}
