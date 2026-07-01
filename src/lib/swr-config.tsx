'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { redirectToLoginOnAuthFailure } from '@/lib/auth-redirect'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

let cachedSession: { token: string; expires: number } | null = null
let pendingSessionPromise: Promise<string> | null = null
let pendingRefreshPromise: Promise<Session | null> | null = null

/**
 * ログイン成功直後にトークンをキャッシュにセットする。
 * preload()呼び出し時にgetSession()をスキップできるため200-500ms短縮。
 */
export function setSessionTokenCache(token: string) {
  cachedSession = { token, expires: Date.now() + 30000 }
}

/**
 * refreshSession() をアプリ全体で1本のプロミスに集約する。
 * Supabase のリフレッシュトークンは「1回限り使い捨て」で、並行リクエストが
 * 同時に refresh を呼ぶと2回目以降は再利用検知でセッション全体が失効する
 * （操作中の突然ログアウトの主因）。ここで pendingRefreshPromise を使い
 * 同時呼出しを1本に集約することで、実際の refresh は1回しか走らない。
 * 完了直後の連続呼出しもキャッシュにヒットさせるため、プロミスは
 * 100ms 遅延でクリアする。
 *
 * 一時的なネットワークエラー（Cloud Run のコールドスタートや WiFi 瞬断）で
 * 即座にログアウトさせないよう、失敗時は 400ms 待って1回だけリトライする。
 */
export async function sharedRefreshSession(): Promise<Session | null> {
  if (pendingRefreshPromise) {
    return pendingRefreshPromise
  }
  const supabase = createClient()
  pendingRefreshPromise = (async () => {
    try {
      const attempt = async () => {
        const { data, error } = await supabase.auth.refreshSession()
        if (error || !data.session) return null
        return data.session
      }
      let session = await attempt()
      if (!session) {
        await new Promise((r) => setTimeout(r, 400))
        session = await attempt()
      }
      if (!session) return null
      const jwtExpiresMs = session.expires_at
        ? session.expires_at * 1000 - 60_000 // JWT 期限の60秒前まで有効とみなす
        : Date.now() + 30_000
      cachedSession = {
        token: session.access_token,
        expires: Math.min(Date.now() + 30_000, jwtExpiresMs),
      }
      return session
    } finally {
      setTimeout(() => {
        pendingRefreshPromise = null
      }, 100)
    }
  })()
  return pendingRefreshPromise
}

/**
 * セッションを段階的に取得する。
 * 1) getSession() を読む
 * 2) 期限切れ間近なら sharedRefreshSession()
 * 3) それでも空なら sharedRefreshSession() を明示的にもう一度試す
 *    （Supabase 内部の autoRefresh と衝突して一時的に空になることがある）
 */
async function resolveSession() {
  const supabase = createClient()
  let session = (await supabase.auth.getSession()).data.session

  const nearExpiry =
    session?.expires_at && session.expires_at * 1000 <= Date.now() + 60_000
  if (nearExpiry) {
    const refreshed = await sharedRefreshSession()
    if (refreshed) session = refreshed
  }

  if (!session?.access_token) {
    const refreshed = await sharedRefreshSession()
    if (refreshed?.access_token) session = refreshed
  }

  return session
}

export async function getSessionToken(): Promise<string> {
  if (cachedSession && Date.now() < cachedSession.expires) {
    return cachedSession.token
  }
  if (pendingSessionPromise) {
    return pendingSessionPromise
  }
  pendingSessionPromise = (async () => {
    try {
      const session = await resolveSession()
      if (!session?.access_token) {
        redirectToLoginOnAuthFailure()
        throw new Error('認証が必要です')
      }
      const jwtExpiresMs = session.expires_at
        ? session.expires_at * 1000 - 60_000
        : Date.now() + 30_000
      cachedSession = {
        token: session.access_token,
        expires: Math.min(Date.now() + 30_000, jwtExpiresMs),
      }
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
    const refreshed = await sharedRefreshSession()
    if (!refreshed?.access_token) {
      redirectToLoginOnAuthFailure()
      throw new Error('認証が必要です。再度ログインしてください。')
    }
    cachedSession = { token: refreshed.access_token, expires: Date.now() + 5000 }

    const retryRes = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshed.access_token}`
      },
    })

    if (!retryRes.ok) {
      if (retryRes.status === 401) {
        redirectToLoginOnAuthFailure()
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
    if (res.status === 503) {
      // 認証サーバ側の一時的な障害。SWRのリトライに任せて、
      // 有効なセッションを勝手にログアウトさせない。
      throw new Error('サーバが一時的に応答できません。少し待って再試行します。')
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
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        revalidateIfStale: true,
        dedupingInterval: 5000,
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
