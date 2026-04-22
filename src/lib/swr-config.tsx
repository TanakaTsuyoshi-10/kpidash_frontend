'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// セッショントークンのメモリキャッシュ（30秒）
// 同時に複数のSWRフェッチが走った際の重複getSession()呼び出しを防ぐ
// JWTの有効期限（通常1時間）よりはるかに短いため安全
let cachedSession: { token: string; expires: number } | null = null
let pendingSessionPromise: Promise<string> | null = null

/**
 * ログイン成功直後にトークンをキャッシュにセットする。
 * preload()呼び出し時にgetSession()をスキップできるため200-500ms短縮。
 */
export function setSessionTokenCache(token: string) {
  cachedSession = { token, expires: Date.now() + 30000 }
}

export async function getSessionToken(): Promise<string> {
  if (cachedSession && Date.now() < cachedSession.expires) {
    return cachedSession.token
  }
  // 同時呼出し時に1つのgetSession()を共有する
  if (pendingSessionPromise) {
    return pendingSessionPromise
  }
  pendingSessionPromise = (async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認証が必要です')
      }
      cachedSession = { token: session.access_token, expires: Date.now() + 30000 }
      return session.access_token
    } finally {
      pendingSessionPromise = null
    }
  })()
  return pendingSessionPromise
}

// Supabaseセッションを使用したグローバルフェッチャー
export async function fetcher(url: string) {
  const token = await getSessionToken()

  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  })

  // 401の場合、キャッシュを破棄してトークンリフレッシュして1回リトライ
  if (res.status === 401) {
    cachedSession = null
    const supabase = createClient()
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
    if (!refreshedSession?.access_token) {
      throw new Error('認証が必要です。再度ログインしてください。')
    }
    cachedSession = { token: refreshedSession.access_token, expires: Date.now() + 5000 }

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
