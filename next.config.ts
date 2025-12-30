import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番環境での最適化
  reactStrictMode: true,

  // 画像の外部ドメイン許可（必要に応じて追加）
  images: {
    remotePatterns: [],
  },

  // ビルド時のESLint/TypeScriptエラーを無視（開発中のため）
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
