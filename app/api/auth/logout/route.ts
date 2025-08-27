import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  
  // すべての認証関連Cookieを削除
  cookieStore.delete('token');
  cookieStore.delete('refresh_token');
  
  // Djangoのログアウトエンドポイントも呼ぶ（オプション）
  try {
    const token = cookieStore.get('token');
    if (token) {
      await fetch(`${process.env.DJANGO_API_URL}/api/v1/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      });
    }
  } catch (error) {
    // ログアウトAPIの失敗は無視（Cookieは削除済み）
    console.error('Django logout failed:', error);
  }
  
  return NextResponse.json({ success: true });
}