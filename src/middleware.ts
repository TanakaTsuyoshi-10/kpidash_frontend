/**
 * 認証状態に基づくルーティング制御
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // リクエストIDを生成（ログ追跡用）
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
          // X-Request-IDを再設定
          response.headers.set('X-Request-ID', requestId)
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
          // X-Request-IDを再設定
          response.headers.set('X-Request-ID', requestId)
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 未認証でダッシュボードにアクセス → ログインへ
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 未認証でその他の保護されたルートにアクセス → ログインへ
  if (!user && (request.nextUrl.pathname.startsWith('/upload') ||
                request.nextUrl.pathname.startsWith('/targets') ||
                request.nextUrl.pathname.startsWith('/settings'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 認証済みでログインページにアクセス → ダッシュボードへ
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/upload/:path*', '/targets/:path*', '/settings/:path*'],
}
