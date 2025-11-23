import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// CSP
const ContentSecurityPolicy = `
  default-src 'none';
  script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com ${isDevelopment ? "'unsafe-eval'" : ""};
  style-src 'self';
  img-src 'self';
  font-src 'self';
  connect-src 'self' ${apiUrl} ${isDevelopment ? "ws: wss:" : ""};
  base-uri 'self';
  form-action 'self';
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
  cacheComponents: true,

  // ビルドタイムアウトエラーを防ぐため、静的ページ生成の制限時間を延長
  staticPageGenerationTimeout: 120,
  
  // React Strict Mode
  reactStrictMode: true,

  // URLの末尾にスラッシュを付ける設定(Django側に合わせる)
  trailingSlash: true,

  // TypeScriptエラーでビルドを失敗させる
  typescript: {
    ignoreBuildErrors: false,
  },

  // セキュリティヘッダー + キャッシュ戦略
  async headers() {
    const activeSecurityHeaders = isDevelopment
    ? securityHeaders.filter((h) => h.key !== 'Content-Security-Policy')
    : securityHeaders;

    const publicCacheHeader = {
      key: 'Cache-Control',
      value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400',
    };

    return [
      // 公開ページ: 積極的キャッシュ
      {
        source: '/',
        headers: [
          ...activeSecurityHeaders,
          publicCacheHeader,
        ],
      },
      {
        source: '/posts',
        headers: [
          ...activeSecurityHeaders,
          publicCacheHeader,
        ],
      },
      {
        source: '/posts/:slug',
        headers: [
          ...activeSecurityHeaders,
          publicCacheHeader,
        ],
      },
      {
        source: '/categories',
        headers: [
          ...activeSecurityHeaders,
          publicCacheHeader,
        ],
      },
      {
        source: '/categories/:slug',
        headers: [
          ...activeSecurityHeaders,
          publicCacheHeader,
        ],
      },
      {
        source: '/search',
        headers: [
          ...activeSecurityHeaders,
          publicCacheHeader,
        ],
      },
      {
        source: '/auth/:path*',
        headers: [
          ...activeSecurityHeaders,
          publicCacheHeader,
        ],
      },
      
      {
        source: '/dashboard/:path*',
        headers: [
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
};
export default nextConfig;