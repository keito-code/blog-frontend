'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type {
  JSendResponse,
  LoginResponse,
  RegisterResponse,
  UserResponse,
  CSRFTokenResponse,
  PrivateUser,
} from '@/types/auth';
import { AUTH_ENDPOINTS, isJSendSuccess, isJSendError } from '@/types/auth';

const DJANGO_API_URL = 'http://localhost:8000';

/**
 * ログインアクション
 */
export async function loginAction(
  email: string,
  password: string,
  redirectTo: string = '/dashboard'
) {
  try {
    // 1. CSRFトークンを取得
    const csrfResponse = await fetch(`${DJANGO_API_URL}${AUTH_ENDPOINTS.CSRF}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!csrfResponse.ok) {
      console.error('CSRF fetch failed:', csrfResponse.status);
      return {
        success: false,
        error: 'セキュリティトークンの取得に失敗しました',
      };
    }

    const csrfData: JSendResponse<CSRFTokenResponse> = await csrfResponse.json();
    
    if (!isJSendSuccess(csrfData)) {
      return {
        success: false,
        error: 'CSRFトークンの取得に失敗しました',
      };
    }
    
    const csrfToken = csrfData.data.csrf_token;
    const csrfCookie = csrfResponse.headers.get('set-cookie') || '';
    
    // 2. ログインリクエスト
    const loginUrl = `${DJANGO_API_URL}${AUTH_ENDPOINTS.LOGIN}`;
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
        'Cookie': csrfCookie.split(';')[0], // csrf_token=xxxxx
      },
      body: JSON.stringify({ email, password }),
    });

    const text = await response.text();
    
    // HTMLレスポンスのチェック
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      console.error('Received HTML instead of JSON');
      console.error('First 500 chars:', text.substring(0, 500));
      return {
        success: false,
        error: 'サーバーエラーが発生しました',
      };
    }

    const data = JSON.parse(text) as JSendResponse<LoginResponse>;

    // 成功時の処理
    if (response.ok && isJSendSuccess(data)) {
      // JWTトークンをCookieに保存
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const cookieStore = await cookies();
        
        // 複数のCookieを処理
        const cookieStrings = setCookie.split(/, (?=\w+=)/);
        for (const cookieString of cookieStrings) {
          const [nameValue] = cookieString.split(';');
          const [name, value] = nameValue.split('=');
          
          if (name === 'access_token' || name === 'refresh_token') {
            cookieStore.set(name, value, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: name === 'access_token' ? 60 * 30 : 60 * 60 * 24 * 14,
            });
          }
        }
      }

      revalidatePath('/', 'layout');
      redirect(redirectTo);
    }

    // エラー処理
    if (isJSendError(data)) {
      return {
        success: false,
        error: data.message || 'ログインに失敗しました',
      };
    }

    // バリデーションエラー（fail）
    if (data.status === 'fail') {
      const errors = data.data as Record<string, string | string[]>;
      const firstError = Object.values(errors)[0];
      return {
        success: false,
        error: Array.isArray(firstError) ? firstError[0] : String(firstError),
      };
    }

    return {
      success: false,
      error: 'ログインに失敗しました',
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
}

/**
 * ログアウトアクション
 */
export async function logoutAction() {
  try {
    // CSRFトークン取得
    const csrfResponse = await fetch(`${DJANGO_API_URL}${AUTH_ENDPOINTS.CSRF}`, {
      method: 'GET',
    });
    
    if (csrfResponse.ok) {
      const csrfData: JSendResponse<CSRFTokenResponse> = await csrfResponse.json();
      if (isJSendSuccess(csrfData)) {
        const csrfToken = csrfData.data.csrf_token;
        const csrfCookie = csrfResponse.headers.get('set-cookie') || '';
        
        // ログアウトリクエスト
        await fetch(`${DJANGO_API_URL}${AUTH_ENDPOINTS.LOGOUT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
            'Cookie': csrfCookie.split(';')[0],
          },
          body: JSON.stringify({}),
        });
      }
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Cookieを削除
    const cookieStore = await cookies();
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
    
    revalidatePath('/', 'layout');
  }
}

/**
 * 新規登録アクション
 */
export async function registerAction(
  username: string,
  email: string,
  password: string,
  passwordConfirmation: string,
  redirectTo: string = '/dashboard'
) {
  try {
    // 1. CSRFトークンを取得
    const csrfResponse = await fetch(`${DJANGO_API_URL}${AUTH_ENDPOINTS.CSRF}`, {
      method: 'GET',
    });

    if (!csrfResponse.ok) {
      return {
        success: false,
        error: 'セキュリティトークンの取得に失敗しました',
      };
    }

    const csrfData: JSendResponse<CSRFTokenResponse> = await csrfResponse.json();
    
    if (!isJSendSuccess(csrfData)) {
      return {
        success: false,
        error: 'CSRFトークンの取得に失敗しました',
      };
    }
    
    const csrfToken = csrfData.data.csrf_token;
    const csrfCookie = csrfResponse.headers.get('set-cookie') || '';

    // 2. 登録リクエスト
    const response = await fetch(`${DJANGO_API_URL}${AUTH_ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
        'Cookie': csrfCookie.split(';')[0],
      },
      body: JSON.stringify({
        username,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    const text = await response.text();
    
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      return {
        success: false,
        error: 'サーバーエラーが発生しました',
      };
    }

    const data = JSON.parse(text) as JSendResponse<RegisterResponse>;

    if (response.status === 201 && isJSendSuccess(data)) {
      // トークンをCookieに保存
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const cookieStore = await cookies();
        const cookieStrings = setCookie.split(/, (?=\w+=)/);
        
        for (const cookieString of cookieStrings) {
          const [nameValue] = cookieString.split(';');
          const [name, value] = nameValue.split('=');
          
          if (name === 'access_token' || name === 'refresh_token') {
            cookieStore.set(name, value, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: name === 'access_token' ? 60 * 30 : 60 * 60 * 24 * 14,
            });
          }
        }
      }

      revalidatePath('/', 'layout');
      redirect(redirectTo);
    }

    if (isJSendError(data)) {
      return {
        success: false,
        error: data.message || '登録に失敗しました',
      };
    }

    if (data.status === 'fail') {
      const errors = data.data as Record<string, string | string[]>;
      const firstError = Object.values(errors)[0];
      return {
        success: false,
        error: Array.isArray(firstError) ? firstError[0] : String(firstError),
      };
    }

    return {
      success: false,
      error: '登録に失敗しました',
    };

  } catch (error) {
    console.error('Register error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
}

/**
 * 現在のユーザー情報を取得
 */
export async function getCurrentUser(): Promise<PrivateUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken) {
      return null;
    }

    const response = await fetch(`${DJANGO_API_URL}${AUTH_ENDPOINTS.USER}`, {
      headers: {
        'Cookie': `access_token=${accessToken.value}`,
      },
      cache: 'no-store',
    });


    if (!response.ok) {
      return null;
    }

    const data: JSendResponse<UserResponse> = await response.json();
    
    if (isJSendSuccess(data)) {
      return data.data.user as PrivateUser;
    }
    
    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}