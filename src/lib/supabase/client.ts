/**
 * ブラウザ側で使用するSupabaseクライアント
 * クライアントコンポーネントで使用
 *
 * 【重要】ブラウザでは必ず単一インスタンス（シングルトン）を返す。
 * createBrowserClient はインスタンスごとに自動トークンリフレッシュの
 * タイマーを持つ。createClient() を呼ぶたびに新しいインスタンスを
 * 作ると、複数のタイマー／複数の getTrueClient が同じ Cookie 上の
 * リフレッシュトークンを取り合い、リフレッシュトークンの二重使用が
 * 発生する。Supabase はトークン再利用を検知するとセッション全体を
 * 失効させるため、画面操作中に突然ログアウトされる原因になる。
 * シングルトン化することで SDK 内部のリフレッシュ排他制御が正しく働く。
 */
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | undefined

export function createClient() {
  // サーバー（SSR）ではモジュールキャッシュがリクエスト間で共有されるため、
  // インスタンスを使い回さず毎回新規生成する（ユーザー間のセッション混在防止）。
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // ブラウザでは単一インスタンスを使い回す。
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}
