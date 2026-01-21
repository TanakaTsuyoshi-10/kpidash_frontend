/**
 * アップロード履歴コンポーネント
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUploadHistory } from '@/lib/api/upload'

export function UploadHistory() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getUploadHistory()
      setMessage(response?.message ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>アップロード履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>アップロード履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>アップロード履歴</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          {message || 'アップロード履歴がありません'}
        </div>
        <p className="text-center text-sm text-gray-400 mt-4">
          この機能は将来のバージョンで拡張予定です
        </p>
      </CardContent>
    </Card>
  )
}
