/**
 * 月次コメント用カスタムフック
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getMonthlyComment,
  saveMonthlyComment,
  deleteMonthlyComment,
} from '@/lib/api/comment'
import type { CommentCategory, MonthlyComment } from '@/types/comment'

interface UseMonthlyCommentReturn {
  commentData: MonthlyComment | null
  comment: string
  loading: boolean
  saving: boolean
  error: string | null
  setComment: (comment: string) => void
  save: () => Promise<void>
  remove: () => Promise<void>
}

export function useMonthlyComment(
  category: CommentCategory,
  period: string
): UseMonthlyCommentReturn {
  const [commentData, setCommentData] = useState<MonthlyComment | null>(null)
  const [comment, setComment] = useState('')
  const [originalComment, setOriginalComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // コメントを取得
  useEffect(() => {
    let cancelled = false

    async function fetchComment() {
      if (!period) return

      try {
        setLoading(true)
        setError(null)
        const data = await getMonthlyComment(category, period)
        if (!cancelled) {
          setCommentData(data)
          const commentText = data?.comment ?? ''
          setComment(commentText)
          setOriginalComment(commentText)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('コメント取得エラー:', err)
          setError(err instanceof Error ? err.message : 'コメントの取得に失敗しました')
          setCommentData(null)
          setComment('')
          setOriginalComment('')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchComment()

    return () => {
      cancelled = true
    }
  }, [category, period])

  // コメントを保存
  const save = useCallback(async () => {
    if (!period || comment === originalComment) return

    try {
      setSaving(true)
      setError(null)
      const savedComment = await saveMonthlyComment({
        category,
        period,
        comment,
      })
      setCommentData(savedComment)
      setOriginalComment(comment)
    } catch (err) {
      console.error('コメント保存エラー:', err)
      const errorMessage = err instanceof Error ? err.message : 'コメントの保存に失敗しました'
      setError(errorMessage)
      throw err
    } finally {
      setSaving(false)
    }
  }, [category, period, comment, originalComment])

  // コメントを削除
  const remove = useCallback(async () => {
    if (!period) return

    try {
      setSaving(true)
      setError(null)
      await deleteMonthlyComment(category, period)
      setCommentData(null)
      setComment('')
      setOriginalComment('')
    } catch (err) {
      console.error('コメント削除エラー:', err)
      const errorMessage = err instanceof Error ? err.message : 'コメントの削除に失敗しました'
      setError(errorMessage)
      throw err
    } finally {
      setSaving(false)
    }
  }, [category, period])

  return {
    commentData,
    comment,
    loading,
    saving,
    error,
    setComment,
    save,
    remove,
  }
}
