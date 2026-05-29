/**
 * 認証失敗時のログイン画面への誘導ヘルパー。
 *
 * セッションが切れた・トークンリフレッシュに失敗した等の場合、現在の
 * URL を `returnTo` に保存しつつ `/login?expired=1` に誘導する。
 * 複数箇所から同時に呼ばれてもログイン画面遷移は1回に集約する。
 */

let redirecting = false

/**
 * 認証エラーを検知したらログイン画面へ誘導する。
 * - すでに /login にいる場合は何もしない
 * - 同時呼出しでも1回だけ遷移する
 * - 現在のURL（パス+クエリ）を `returnTo` として持ち回り、ログイン後に復帰可能にする
 */
export function redirectToLoginOnAuthFailure(): void {
  if (typeof window === 'undefined') return
  if (redirecting) return

  const path = window.location.pathname
  if (path.startsWith('/login')) return

  redirecting = true
  const returnTo = encodeURIComponent(
    window.location.pathname + window.location.search
  )
  // 即時のハードナビゲートで他のSWRフェッチ・autoRefresh等を確実に止める
  window.location.replace(`/login?expired=1&returnTo=${returnTo}`)
}

/**
 * ログイン成功時に redirecting フラグを下ろす（テスト・例外復帰用）。
 */
export function resetAuthRedirectFlag(): void {
  redirecting = false
}

/**
 * エラーオブジェクト・メッセージが「セッション切れ」を示すかを判定する。
 */
export function isAuthExpiredError(err: unknown): boolean {
  if (!err) return false
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('認証が必要です') ||
    message.includes('Invalid Refresh Token') ||
    message.includes('refresh_token_not_found')
  )
}
