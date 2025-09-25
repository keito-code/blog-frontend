import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const accessToken = request.cookies.get('access_token');
    const refreshToken = request.cookies.get('refresh_token');
    
    // トークンがない場合
    if (!accessToken && !refreshToken) {
      // ✅ 修正: /auth/login へリダイレクト
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // トークンがある場合は通過させる
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*'
};