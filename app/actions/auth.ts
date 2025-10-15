'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { CSRFTokenResponse } from '@/types/auth';
import type { UserResponse, PrivateUser } from '@/types/user';
import { AUTH_ENDPOINTS } from '@/types/auth';
import { USER_ENDPOINTS } from '@/types/user';
import { 
  JSendResponse, 
  isJSendSuccess, 
  isJSendFail, 
  isJSendError,
  ERROR_CODES,
  ActionResult,
} from '@/types/api';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

// カスタムエラークラス
class AuthenticationError extends Error {
  constructor(message = '認証が必要です') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public errors?: Record<string, string | string[]>) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * CSRFトークンを取得
 */
async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  
  // 既にCSRFトークンがCookieに存在する場合はそれを使用
  const existingToken = cookieStore.get('csrftoken')?.value;
  if (existingToken) {
    return existingToken;
  }
  
  try {
    const res = await fetch(`${DJANGO_API_URL}${AUTH_ENDPOINTS.CSRF}`, { 
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
      }
    });
    
    if (!res.ok) {
      console.error('CSRF取得失敗:', res.status);
      return null;
    }
    
    const data = await res.json() as JSendResponse<CSRFTokenResponse>;
    if (isJSendSuccess(data)) {
      return data.data.csrfToken;
    }
    
    return null;
  } catch (error) {
    console.error('CSRFトークン取得エラー:', error);
    return null;
  }
}

/**
 * 共通のAPIフェッチ関数（認証不要版）
 * ログイン・登録など、認証前のエンドポイント用
 */
async function apiFetchPublic<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');
    
  // メソッド判定
  const method = options.method?.toUpperCase() || 'GET';
  
  // state-changingメソッドの場合のみCSRFトークンを取得
  let csrfToken: string | null = null;
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      csrfToken = await getCSRFToken();
      if (!csrfToken && process.env.NODE_ENV === 'development') {
        console.warn('CSRFトークンが取得できませんでした');
      }
  }
  
  // デフォルトヘッダー
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cookie': cookieHeader,
    ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
  };

  
  const response = await fetch(`${DJANGO_API_URL}${endpoint}`, {
    ...options,
    method,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  
  // Content-Type検証
  const contentType = response.headers.get('content-type');
  if (response.status !== 204 && !contentType?.includes('application/json')) {
    throw new Error(`期待されないContent-Type: ${contentType || 'undefined'}`);
  }
  
  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }
  
  // JSONパース
  let data: JSendResponse<T>;
  try {
    data = await response.json();
  } catch {
    throw new Error(`APIレスポンスの解析に失敗しました`);
  }
  
  // JSendフォーマット処理
  if (isJSendSuccess(data)) {
    return data.data;
  } else if (isJSendFail(data)) {
    const errors = Object.entries(data.data)
      .map(([field, messages]) => {
        const msgArray = Array.isArray(messages) ? messages : [messages];
        return `${field}: ${msgArray.join(', ')}`;
      })
      .join('; ');
    throw new ValidationError(`入力エラー: ${errors}`, data.data);
  } else if (isJSendError(data)) {
    throw new Error(data.message || 'APIエラーが発生しました');
  }
  
  // JSend以外（後方互換）
  if (!response.ok) {
    throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
  }
  
  return data as unknown as T;
}

/**
 * 認証付きAPIフェッチ関数
 * 認証が必要なエンドポイント用（getCurrentUser等）
 */
async function apiFetchAuth<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  
  // access_tokenの存在確認
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    throw new AuthenticationError('認証トークンが見つかりません');
  }
  
  // 通常のapiFetch処理を実行
  return apiFetchPublic<T>(endpoint, options);
}

/**
 * 現在のユーザー情報を取得
 */
export async function getCurrentUser(): Promise<PrivateUser | null> {
  try {
    const data = await apiFetchAuth<UserResponse>(
      USER_ENDPOINTS.ME,
      {
        method: 'GET',
    
        next: { revalidate: 60 }
      }
    );
    
    return data.user as PrivateUser;
    
  } catch (error) {
    // 認証エラーの場合はnullを返す（未ログイン状態）
    if (error instanceof AuthenticationError) {
      return null;
    }
    
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * プロフィール更新アクション
 * 一般ユーザーはemailのみ変更可能
 */
export async function updateProfileAction(
  email: string
): Promise<ActionResult<UserResponse>> {
  try {
    const data = await apiFetchAuth<UserResponse>(
      USER_ENDPOINTS.ME,
      {
        method: 'PATCH',
        body: JSON.stringify({ email }),
      }
    );
    
    // キャッシュ更新
    revalidatePath('/', 'layout');
    
    return {
      status: 'success',
      message: 'メールアドレスを更新しました',
      data
    };
    
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof AuthenticationError) {
      return {
        status: 'error',
        message: error.message,
        code: ERROR_CODES.UNAUTHORIZED
      };
    }
    
    if (error instanceof ValidationError) {
      return {
        status: 'error',
        message: error.message,
        errors: error.errors
      };
    }
    
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'メールアドレスの更新に失敗しました'
    };
  }
}