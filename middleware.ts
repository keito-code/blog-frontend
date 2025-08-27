import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('token');
    const refreshToken = request.cookies.get('refresh_token');
    
    // トークンがない場合
    if (!token && !refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // トークンがある場合は検証
    if (token) {
      try {
        const response = await fetch(`${process.env.DJANGO_API_URL}/api/v1/auth/user/`, {
          headers: { 'Authorization': `Bearer ${token.value}` }
        });
        
        if (response.ok) {
          return NextResponse.next();
        }
      } catch (error) {
        console.error('Token validation failed:', error);
      }
    }
    
    // トークンが無効でリフレッシュトークンがある
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${process.env.DJANGO_API_URL}/api/v1/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken.value })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const response = NextResponse.next();
          
          // 新しいトークンをセット（2時間）
          response.cookies.set('token', data.access, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 2, // 2時間
            path: '/'
          });
          
          // リフレッシュトークンも更新（30日）
          if (data.refresh) {
            response.cookies.set('refresh_token', data.refresh, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 30, // 30日
              path: '/'
            });
          }
          
          return response;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }
    
    // すべて失敗したらログインページへ
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    response.cookies.delete('refresh_token');
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*'
};