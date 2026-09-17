/**
 * 認証状態に基づくルーティング制御
 *
 * 【重要】ここでは Supabase クライアントを作らず、ネットワークも呼ばない。
 * createServerClient + getSession() は、アクセストークンが期限切れの場合
 * サーバー側でリフレッシュを実行してしまう（autoRefreshToken 設定とは無関係に
 * __loadSession が _callRefreshToken を呼ぶ）。これがブラウザ側で一本化している
 * リフレッシュ（sharedRefreshSession）と独立にリフレッシュトークンを回転させ、
 * Set-Cookie がブラウザに届かないケース（中断されたナビゲーション・破棄された
 * プリフェッチ・モバイル回線の瞬断・スリープ）で Cookie と実際のトークン系列が
 * 食い違う。その後ブラウザが旧トークンでリフレッシュすると再利用検知で
 * セッション全体が失効し、「操作中に突然ログアウトされる」原因になっていた。
 *
 * そのためミドルウェアは Cookie の存在確認と exp のローカルデコードのみで
 * ルーティングを判定し、リフレッシュは常にブラウザ側だけが実行する。
 */
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/upload', '/targets', '/settings']

/**
 * Supabase の認証 Cookie（sb-<ref>-auth-token）の生の値を返す。
 * サイズ超過で分割された Cookie（...-auth-token.0, .1, ...）にも対応する。
 */
function readAuthCookie(request: NextRequest): string | null {
  const all = request.cookies.getAll()
  const base = all.find((c) => /^sb-[a-z0-9]+-auth-token$/.test(c.name))
  if (base?.value) return base.value

  const chunks = all
    .filter((c) => /^sb-[a-z0-9]+-auth-token\.\d+$/.test(c.name))
    .sort(
      (a, b) =>
        Number(a.name.split('.').pop()) - Number(b.name.split('.').pop())
    )
  if (chunks.length === 0) return null
  return chunks.map((c) => c.value).join('')
}

/** base64url / base64 文字列をデコードする（Edge ランタイムのため atob を使用） */
function b64Decode(input: string): string {
  const std = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = std + '='.repeat((4 - (std.length % 4)) % 4)
  return atob(padded)
}

/**
 * Cookie のセッション JSON から access_token の exp（epoch 秒）を取り出す。
 * 署名検証はしない（ここでの用途はログイン画面からの UX 用リダイレクト判定のみで、
 * 実際の認可はバックエンド API が毎リクエスト検証する）。
 */
function readTokenExp(raw: string): number | null {
  try {
    let json: string
    if (raw.startsWith('base64-')) {
      json = b64Decode(raw.slice('base64-'.length))
    } else {
      try {
        json = decodeURIComponent(raw)
      } catch {
        json = raw
      }
    }
    const session = JSON.parse(json)
    const token: unknown = session?.access_token
    if (typeof token !== 'string') return null
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const payload = JSON.parse(b64Decode(payloadPart))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // リクエストIDを生成（ログ追跡用）
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)

  const raw = readAuthCookie(request)
  const hasSessionCookie = raw !== null
  const path = request.nextUrl.pathname

  // 未認証（Cookie なし）で保護されたルートにアクセス → ログインへ。
  // Cookie がある場合はアクセストークンが期限切れでも通す：ブラウザ側が
  // リフレッシュして継続するか、復帰不能なら /login?expired=1 へ誘導する。
  if (!hasSessionCookie && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 有効期限内のセッションを持ったままログインページにアクセス → ダッシュボードへ。
  // 期限切れ・解析不能の場合はそのままログイン画面を表示する（再ログイン）。
  if (hasSessionCookie && path === '/login') {
    const exp = readTokenExp(raw)
    if (exp !== null && exp * 1000 > Date.now() + 60_000) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/upload/:path*', '/targets/:path*', '/settings/:path*'],
}
