// app/api/auth/login/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Django APIにログインリクエスト（username使用）
    const response = await fetch(`${process.env.DJANGO_API_URL}/api/v1/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: body.username,  // emailではなくusername
        password: body.password,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'ユーザー名またはパスワードが正しくありません' },
        { status: response.status }
      );
    }
    
    const cookieStore = await cookies();
    
    // アクセストークンをHttpOnly Cookieとして保存
    cookieStore.set('token', data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2時間
      path: '/',
    });
    
    // リフレッシュトークンも保存
    if (data.refresh) {
      cookieStore.set('refresh_token', data.refresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30日
        path: '/',
      });
    }
    
    // ユーザー情報を返す
    return NextResponse.json({ 
      success: true,
      user: data.user || { username: body.username }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'ネットワークエラーが発生しました' },
      { status: 500 }
    );
  }
}