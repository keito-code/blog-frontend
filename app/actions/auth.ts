'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type {
  LoginResponse,
  RegisterResponse,
  CSRFTokenResponse,
} from '@/types/auth';
import type {
  UserResponse,
  PrivateUser,
} from '@/types/user';
import { AUTH_ENDPOINTS } from '@/types/auth';
import { USER_ENDPOINTS } from '@/types/user';
import { JSendResponse, isJSendSuccess, isJSendError } from '@/types/api';

// 環境変数から取得（.env.localに定義）
const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

// CSRFトークン取得の共通化
async function getCSRFToken() {
  const res = await fetch(`${DJANGO_API_URL}${AUTH_ENDPOINTS.CSRF}`, { 
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!res.ok) {
    throw new Error('CSRF token fetch failed');
  }
  
  const data = await res.json() as JSendResponse<CSRFTokenResponse>;
  if (!isJSendSuccess(data)) {
    throw new Error('Invalid CSRF response');
  }
  
  return {
    token: data.data.csrf_token,
    cookie: res.headers.get('set-cookie')?.split(';')[0] || ''
  };
}

// Cookie保存処理の共通化
async function saveAuthCookies(setCookieHeader: string | null) {
  if (!setCookieHeader) return;
  
  const cookieStore = await cookies();
  const cookieStrings = setCookieHeader.split(/, (?=\w+=)/);
  
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
    const csrf = await getCSRFToken();
    
    // 2. ログインリクエスト
    const response = await fetch(`${DJANGO_API_URL}${AUTH_ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrf.token,
        'Cookie': csrf.cookie,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json() as JSendResponse<LoginResponse>;

    // 成功時の処理
    if (response.ok && isJSendSuccess(data)) {
      await saveAuthCookies(response.headers.get('set-cookie'));
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
    const csrf = await getCSRFToken();
    
    // ログアウトリクエスト
    await fetch(`${DJANGO_API_URL}${AUTH_ENDPOINTS.LOGOUT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrf.token,
        'Cookie': csrf.cookie,
      },
      body: JSON.stringify({}),
    });
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
    const csrf = await getCSRFToken();

    // 2. 登録リクエスト
    const response = await fetch(`${DJANGO_API_URL}${AUTH_ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrf.token,
        'Cookie': csrf.cookie,
      },
      body: JSON.stringify({
        username,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    const data = await response.json() as JSendResponse<RegisterResponse>;

    if (response.status === 201 && isJSendSuccess(data)) {
      await saveAuthCookies(response.headers.get('set-cookie'));
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

    const response = await fetch(`${DJANGO_API_URL}${USER_ENDPOINTS.ME}`, {
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