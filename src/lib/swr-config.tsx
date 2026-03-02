'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Supabaseセッションを使用したグローバルフェッチャー
async function fetcher(url: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('認証が必要です')
  }

  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
  })

  // 401の場合、トークンリフレッシュして1回リトライ
  if (res.status === 401) {
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
    if (!refreshedSession?.access_token) {
      throw new Error('認証が必要です。再度ログインしてください。')
    }

    const retryRes = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshedSession.access_token}`
      },
    })

    if (!retryRes.ok) {
      if (retryRes.status === 401) {
        throw new Error('認証が必要です。再度ログインしてください。')
      }
      const error = await retryRes.json().catch(() => ({}))
      throw new Error(error.detail || `APIエラーが発生しました (${retryRes.status})`)
    }

    return retryRes.json()
  }

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('リクエスト数が制限を超えました。しばらく待ってから再試行してください。')
    }
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail || `APIエラーが発生しました (${res.status})`)
  }

  return res.json()
}

interface SWRProviderProps {
  children: ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        revalidateIfStale: true,
        dedupingInterval: 60000,
        keepPreviousData: true,
        errorRetryCount: 3,
        errorRetryInterval: 3000,
        shouldRetryOnError: (error) => {
          // 認証エラーはリトライしない
          if (error?.message?.includes('認証')) return false
          return true
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
