import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('access_token')?.value;

  // 認証状態の判定
  // 「アクセストークンがある」なら true
  // !! は値を boolean (true/false) に強制変換する
  const isAuthenticated = !!accessToken;

  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/auth/')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// matcherは、ミドルウェアを実行するパスを指定するフィルター
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*'
  ]
};