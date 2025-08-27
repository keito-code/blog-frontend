import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // フロントエンドと同じバリデーション
    const errors: string[] = [];
    
    if (!body.email) {
      errors.push('メールアドレスは必須です');
    } else if (!/\S+@\S+\.\S+/.test(body.email)) {
      errors.push('メールアドレスの形式が正しくありません');
    }
    
    if (!body.username) {
      errors.push('ユーザー名は必須です');
    } else if (body.username.length < 3) {
      errors.push('ユーザー名は3文字以上必要です');
    }
    
    if (!body.password) {
      errors.push('パスワードは必須です');
    } else if (body.password.length < 8) {
      errors.push('パスワードは8文字以上必要です');
    }
    
    if (body.password !== body.passwordConfirmation) {
      errors.push('パスワードが一致しません');
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join('\n') },
        { status: 400 }
      );
    }
    
    // Django APIに登録リクエスト
    const djangoData = {
      username: body.username,
      email: body.email,
      password: body.password,
      password_confirmation: body.passwordConfirmation,
      first_name: body.firstName || '',
      last_name: body.lastName || '',
    };
    
    const response = await fetch(`${process.env.DJANGO_API_URL}/api/v1/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(djangoData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Djangoからのエラーメッセージを整形
      let errorMessage = '登録に失敗しました';
      if (data.username) {
        errorMessage = 'このユーザー名は既に使用されています';
      } else if (data.email) {
        errorMessage = 'このメールアドレスは既に登録されています';
      } else if (data.detail) {
        errorMessage = data.detail;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
    
    const cookieStore = await cookies();
    
    // 登録成功時、自動ログイン
    if (data.access) {
      cookieStore.set('token', data.access, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 2, // 2時間
        path: '/',
      });
      
      if (data.refresh) {
        cookieStore.set('refresh_token', data.refresh, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30日
          path: '/',
        });
      }
    }
    
    return NextResponse.json({ 
      success: true,
      user: data.user
    });
    
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'ネットワークエラーが発生しました' },
      { status: 500 }
    );
  }
}