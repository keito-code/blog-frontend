import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const accessToken = request.cookies.get('access_token');
    const refreshToken = request.cookies.get('refresh_token');
    
    // トークンがない場合
    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // アクセストークンがある場合は通過させる
    // （検証はServer Component側で行う）
    if (accessToken) {
      return NextResponse.next();
    }
    
    // リフレッシュトークンのみの場合もとりあえず通過
    // （実際のリフレッシュはServer Actions側で処理）
    if (refreshToken) {
      return NextResponse.next();
    }
    
    // すべて失敗したらログインページへ
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*'
};