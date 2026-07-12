import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // コンパイラ最適化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // 最適化されたパッケージインポート
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', '@supabase/supabase-js'],
  },

  async headers() {
    // ローカル開発時はローカルバックエンド（localhost:8000）への接続を許可する
    const isDev = process.env.NODE_ENV !== 'production'
    const connectSrc = [
      "'self'",
      'https://kpidash-backend-15142953408.asia-northeast1.run.app',
      'https://oaymbdcnzycvhtwlntql.supabase.co',
      'wss://oaymbdcnzycvhtwlntql.supabase.co',
      ...(isDev ? ['http://localhost:8000', 'ws://localhost:3000', 'ws://localhost:3001'] : []),
    ].join(' ')

    return [
      {
        source: '/:path*',
        headers: [
          // 既存のセキュリティヘッダー
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              `connect-src ${connectSrc}`,
              // 取締役会資料: Googleスライドの埋め込み表示を許可
              "frame-src https://docs.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      },
      // 静的アセット用キャッシュ（_next/static配下のみ）
      // 本番: チャンクURLにコンテンツハッシュが付くので immutable で長期キャッシュ
      // 開発: URLが変わらないため immutable にするとコード更新がブラウザに届かなくなる
      //       （古いJSが1年キャッシュされる）ので no-store にする
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev
              ? 'no-store, must-revalidate'
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig
