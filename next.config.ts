import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// CSP
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${isDevelopment ? "'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self';
  font-src 'self';
  connect-src 'self' ${apiUrl} ${isDevelopment ? "ws: wss:" : ""};
  object-src 'none';
  frame-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  // React Strict Mode
  reactStrictMode: true,

  // TypeScriptエラーでビルドを失敗させる
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLintエラーでビルドを失敗させる
  eslint: {
    ignoreDuringBuilds: false,
  },

  // セキュリティヘッダー + キャッシュ戦略
  async headers() {
    const activeSecurityHeaders = isDevelopment
    ? securityHeaders.filter((h) => h.key !== 'Content-Security-Policy')
    : securityHeaders;

    return [
      // 公開ページ: 積極的キャッシュ
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          ...activeSecurityHeaders,
        ],
      },
      {
        source: '/posts',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          ...activeSecurityHeaders,
        ],
      },
      {
        source: '/posts/:slug',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          ...activeSecurityHeaders,
        ],
      },
      {
        source: '/categories',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          ...activeSecurityHeaders,
        ],
      },
      {
        source: '/categories/:slug',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          ...activeSecurityHeaders,
        ],
      },
      {
        source: '/search',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=600, stale-while-revalidate=3600',
          },
          ...activeSecurityHeaders,
        ],
      },
      // 認証ページ: キャッシュなし
      {
        source: '/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store',
          },
          ...activeSecurityHeaders,
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store',
          },
          ...activeSecurityHeaders,
        ],
      },
      // 静的アセット: 長期キャッシュ
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // その他のページ: セキュリティヘッダーのみ
      {
        source: '/:path*',
        headers: activeSecurityHeaders,
      },
    ];
  },

  // 画像設定（現在外部画像を使用していないので最小限）
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // 環境変数
  env: {
    DJANGO_API_URL: process.env.DJANGO_API_URL,
  },

  // Webpack設定
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // 本番環境ではソースマップを無効化
    if (isProduction) {
      config.devtool = false;
    }
    
    return config;
  },

  // Vercelデプロイ用
  output: 'standalone',
};

export default nextConfig;