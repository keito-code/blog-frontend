import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// CSPディレクティブ（実装済み機能のみ）
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${isDevelopment ? "'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self' data:;
  connect-src 'self' ${isDevelopment ? "ws: wss:" : ""};
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

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/:path*',
        headers: isProduction
          ? securityHeaders
          : securityHeaders.filter(
              (header) => header.key !== 'Content-Security-Policy'
            ),
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