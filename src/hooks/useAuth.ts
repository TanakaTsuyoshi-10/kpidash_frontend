/**
 * 認証状態管理フック（セキュリティ強化版）
 */
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { preload } from 'swr'
import { fetcher, setSessionTokenCache } from '@/lib/swr-config'
import { redirectToLoginOnAuthFailure } from '@/lib/auth-redirect'
import { getCurrentFiscalYear, getPreviousMonth, getCalendarYear } from '@/lib/fiscal-year'

// 非アクティブタイムアウト（30分）
const INACTIVITY_TIMEOUT = 30 * 60 * 1000
// 警告表示（タイムアウト5分前）
const WARNING_BEFORE = 5 * 60 * 1000

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const lastActivityRef = useRef<number>(Date.now())
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningShownRef = useRef(false)
  // 意図的なログアウトかどうかを記録（SIGNED_OUT イベントの自動誘導と区別するため）
  const intentionalSignOutRef = useRef(false)

  // アクティビティを記録
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  // ログアウト処理（意図的）
  const signOut = useCallback(async (message?: string) => {
    intentionalSignOutRef.current = true
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setSession(null)
      setUser(null)
      if (message) {
        router.push(`/login?message=${encodeURIComponent(message)}`)
      } else {
        router.push('/login')
      }
    }
  }, [router, supabase.auth])

  // 非アクティブチェック
  useEffect(() => {
    if (!user) return

    const checkInactivity = () => {
      const inactiveTime = Date.now() - lastActivityRef.current
      if (inactiveTime > INACTIVITY_TIMEOUT) {
        signOut('セッションがタイムアウトしました。再度ログインしてください。')
      } else if (inactiveTime > INACTIVITY_TIMEOUT - WARNING_BEFORE && !warningShownRef.current) {
        toast.warning('5分以内に操作がない場合、自動ログアウトされます', {
          duration: 10000,
          action: {
            label: '延長する',
            onClick: () => recordActivity(),
          },
        })
        warningShownRef.current = true
      } else if (inactiveTime < INACTIVITY_TIMEOUT - WARNING_BEFORE) {
        warningShownRef.current = false
      }
    }

    // 1分ごとにチェック
    inactivityTimerRef.current = setInterval(checkInactivity, 60000)

    // ユーザーアクティビティを監視
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, recordActivity, { passive: true })
    })

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current)
      }
      events.forEach(event => {
        window.removeEventListener(event, recordActivity)
      })
    }
  }, [user, signOut, recordActivity])

  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // 意図しない SIGNED_OUT（Supabase の自動リフレッシュ失敗等）を検知して
        // ログイン画面へ自動誘導する。signOut() による意図的ログアウトでは
        // intentionalSignOutRef が true のためここはスキップされる。
        if (event === 'SIGNED_OUT' && !intentionalSignOutRef.current) {
          redirectToLoginOnAuthFailure()
        }
        // 次回のための初期化
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          intentionalSignOutRef.current = false
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string, returnTo?: string) => {
    // 意図的ログアウトのフラグを解除（過去にログアウトしていた場合に備えて）
    intentionalSignOutRef.current = false

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    // ログイン成功後、セッションからトークンを即座にキャッシュ
    // preload()時のgetSession()呼び出しを省略し200-500ms短縮
    const { data: { session: newSession } } = await supabase.auth.getSession()
    if (newSession?.access_token) {
      setSessionTokenCache(newSession.access_token)
    }

    // 無効化されたアカウントを即座にブロックする
    // バックエンドの /users/me は is_active=false の場合 403 を返すため、
    // それを検知して Supabase 側もサインアウトし、エラーを表示する。
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    try {
      const meRes = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${newSession?.access_token ?? ''}`,
          'Content-Type': 'application/json',
        },
      })
      if (meRes.status === 403) {
        intentionalSignOutRef.current = true
        await supabase.auth.signOut()
        throw new Error(
          'このアカウントは無効化されています。管理者にお問い合わせください。'
        )
      }
      if (meRes.ok) {
        const me = await meRes.json()
        if (me && me.is_active === false) {
          intentionalSignOutRef.current = true
          await supabase.auth.signOut()
          throw new Error(
            'このアカウントは無効化されています。管理者にお問い合わせください。'
          )
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('無効化')) {
        throw err
      }
      // 通信エラー時はログインを通す（既存挙動を優先）
    }

    // ダッシュボードデータをプリロード（ページ遷移と並行してフェッチ開始）
    const year = getCurrentFiscalYear()
    const month = getPreviousMonth()
    const periodString = `${getCalendarYear(year, month)}-${String(month).padStart(2, '0')}-01`
    preload('/api/v1/users/me', fetcher)
    preload(`/api/v1/dashboard?period_type=monthly&year=${year}&month=${month}`, fetcher)
    preload('/api/v1/dashboard/chart?months=12', fetcher)
    preload(`/products/store-summary?month=${periodString}&department_slug=store&period_type=monthly`, fetcher)
    preload(`/ecommerce/channel-summary?month=${periodString}&period_type=monthly`, fetcher)

    // returnTo が指定されていればそこへ戻る（セッション切れ復帰時など）
    // 安全のため同一オリジン内の絶対パスのみ受け付ける
    const safeReturnTo =
      returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
        ? returnTo
        : '/dashboard'
    router.replace(safeReturnTo)
  }

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  }
}
