/**
 * 認証状態管理フック（セキュリティ強化版）
 */
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// 非アクティブタイムアウト（30分）
const INACTIVITY_TIMEOUT = 30 * 60 * 1000

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const lastActivityRef = useRef<number>(Date.now())
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // アクティビティを記録
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  // ログアウト処理
  const signOut = useCallback(async (message?: string) => {
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
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    router.push('/dashboard')
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
