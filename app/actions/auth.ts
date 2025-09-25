'use server';

import { cookies } from 'next/headers';
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
import { 
  JSendResponse, 
  isJSendSuccess, 
  isJSendFail, 
  isJSendError,
  ERROR_CODES,
  ActionResult,
  ActionSuccess,
  ActionError
} from '@/types/api';

// 環境変数から取得
const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

// カスタムエラークラス（posts.tsと共通化する場合は別ファイルへ）
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
 * Djangoがset_cookieで設定済みのものを優先的に使用
 */
async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  
  // 既にCSRFトークンがCookieに存在する場合はそれを使用
  const existingToken = cookieStore.get('csrf_token')?.value;
  if (existingToken) {
    return existingToken;
  }
  
  // 初回のみ取得
  console.warn('CSRFトークンが存在しません。初回取得を実行します。');

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
  
  // 開発環境での警告
  if (process.env.NODE_ENV === 'development') {
    console.warn('[API] Server Action内でCookieヘッダーを手動送信しています');
  }
  
  // メソッド判定
  const method = options.method?.toUpperCase() || 'GET';
  
  // state-changingメソッドの場合のみCSRFトークンを取得
  let csrfToken: string | null = null;
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      csrfToken = await getCSRFToken();
      console.log(`[DEBUG] CSRFトークン: ${csrfToken ? '取得成功' : '取得失敗'}`);
      console.log(`[DEBUG] Cookie header: ${cookieHeader}`);
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

  console.log('[DEBUG] Headers being sent:', defaultHeaders);
  
  const response = await fetch(`${DJANGO_API_URL}${endpoint}`, {
    ...options,
    method,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  console.log(`[DEBUG] Response status: ${response.status}`);
  
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
  } catch (error) {
    throw new Error('APIレスポンスの解析に失敗しました');
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
 * ログインアクション
 /
export async function loginAction(
  email: string,
  password: string
): Promise<ActionResult<LoginResponse>> {
  try {
    const csrfToken = await getCSRFToken();
    console.log('=== CSRFトークン取得結果 ===');
    console.log('CSRFトークン:', csrfToken);
    
    // ログインリクエスト（CSRFトークンをCookieとHeaderの両方に設定）
    const  headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': `csrf_token=${csrfToken}`,  // 手動でCookie設定
        'X-CSRFToken': csrfToken || '',
      };
      console.log('=== 送信するヘッダー ===');
      console.log('Cookie:', headers['Cookie']);
      console.log('X-CSRFToken:', headers['X-CSRFToken']);

      // 🔍 追加: リクエスト詳細ログ
    const url = `${DJANGO_API_URL}${AUTH_ENDPOINTS.LOGIN}`;
    const body = JSON.stringify({ email, password });
    console.log('=== リクエスト詳細 ===');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Body:', body);

    // ログインリクエスト（CSRFトークンをCookieとHeaderの両方に設定）
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    // 🔍 追加: レスポンス詳細ログ
    console.log('=== レスポンス情報 ===');
    console.log('Status:', response.status);
    console.log('StatusText:', response.statusText);

    // Set-Cookieヘッダーを取得
    const setCookieHeaders = response.headers.getSetCookie();
    console.log('=== Set-Cookieヘッダーの詳細 ===');
    console.log('Set-Cookie count:', setCookieHeaders.length);
    setCookieHeaders.forEach((cookie, index) => {
      const cookieName = cookie.split('=')[0];
      console.log(`Set-Cookie[${index}] (${cookieName}):`, cookie);
    });
    
    const data = await response.json() as JSendResponse<LoginResponse>;

    // 🔍 追加: JSONデータのログ
    console.log('=== レスポンスJSONデータ ===');
    console.log('Parsed Data:', JSON.stringify(data, null, 2));

    // エラーレスポンスの処理
    if (!response.ok) {
      // 🔍 追加: エラー時の詳細ログ
      console.log('=== エラーレスポンスの詳細 ===');
      console.log('Response not OK. Status:', response.status);
      console.log('Error data type:', typeof data);
      console.log('Error data:', data);

      if (isJSendError(data)) {
        throw new Error(data.message || 'ログインに失敗しました');
      }
      if (isJSendFail(data)) {
        const errors = Object.entries(data.data)
          .map(([field, messages]) => {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgArray.join(', ')}`;
          })
          .join('; ');
        throw new ValidationError(`入力エラー: ${errors}`, data.data);
      }
      throw new Error('ログインに失敗しました');
    }
    
    // 成功レスポンスの処理
    if (isJSendSuccess(data)) {
      // 🔍 追加: 成功時のログ
      console.log('=== ログイン成功 ===');
      console.log('Success data:', data.data);
      console.log('User data:', data.data.user);

      // 🔥 重要: DjangoからのSet-CookieヘッダーをNext.jsのcookiesに転送
      const cookieStore = await cookies();

      // 各Set-Cookieヘッダーを解析して設定
      setCookieHeaders.forEach(cookieString => {
        // Cookie文字列を解析
        const [nameValue, ...attributes] = cookieString.split('; ');
        const [name, value] = nameValue.split('=');
        
        // 属性を解析してオプションオブジェクトを構築
        const cookieOptions: any = {
          value,
          httpOnly: false,  // デフォルト値
          path: '/',
          sameSite: 'lax' as const,
        };
        
        attributes.forEach(attr => {
          const [key, val] = attr.split('=');
          const lowerKey = key.toLowerCase();
          
          switch(lowerKey) {
            case 'max-age':
              cookieOptions.maxAge = parseInt(val);
              break;
            case 'expires':
              const expiresDate = new Date(val);
              // maxAgeとexpiresの両方がある場合、maxAgeを優先
              if (!cookieOptions.maxAge) {
                cookieOptions.expires = expiresDate;
              }
              break;
            case 'path':
              cookieOptions.path = val || '/';
              break;
            case 'domain':
              cookieOptions.domain = val;
              break;
            case 'samesite':
              cookieOptions.sameSite = val.toLowerCase() as 'lax' | 'strict' | 'none';
              break;
            case 'secure':
              cookieOptions.secure = true;
              break;
            case 'httponly':
              cookieOptions.httpOnly = true;
              break;
          }
        });
        
        // Next.jsのcookieストアに設定
        console.log(`Setting cookie: ${name}`, cookieOptions);
        
        // cookieStore.setを使用
        try {
          // HttpOnlyフラグは除外（Server Actionsでは設定できない制限がある場合）
          const { httpOnly, ...optionsForSet } = cookieOptions;
          cookieStore.set(name, value, optionsForSet);
          console.log(`Cookie set successfully: ${name}`);
        } catch (cookieError) {
          console.error(`Failed to set cookie ${name}:`, cookieError);
          // エラーが発生してもログイン処理は続行
        }
      });



      revalidatePath('/', 'layout');
      return {
        status: 'success',
        message: 'ログインに成功しました',
        data: data.data  // JSend形式のdataフィールド
      };
    }
    
    throw new Error('予期しないレスポンス形式');
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof ValidationError) {
      const firstError = error.errors ? Object.values(error.errors)[0] : null;
      const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      
      return {
        status: 'error',
        message: errorMessage || error.message,
        errors: error.errors
      };
    }
    
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'ログインに失敗しました'
    };
  }
}
  

/**
 * ログアウトアクション
 
export async function logoutAction(): Promise<ActionResult<void>> {
  try {
    // ログアウトエンドポイントを呼び出し
    await apiFetchAuth(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    
    // キャッシュ更新
    revalidatePath('/', 'layout');
    
    return {
      status: 'success',
      message: 'ログアウトしました',
      data: undefined
    };
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // エラーが発生してもログアウト処理は続行
    revalidatePath('/', 'layout');
    
    return {
      status: 'success',
      message: 'ログアウトしました',
      data: undefined
    };
  }
}
*/
/**
 * 新規登録アクション
 
export async function registerAction(
  username: string,
  email: string,
  password: string,
  passwordConfirmation: string
): Promise<ActionResult<RegisterResponse>> {
  // クライアント側バリデーション
  if (password !== passwordConfirmation) {
    return {
      status: 'error',
      message: 'パスワードが一致しません'
    };
  }
  
  try {
    const data = await apiFetchPublic<RegisterResponse>(
      AUTH_ENDPOINTS.REGISTER,
      {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          password,
          passwordConfirmation,
        }),
      }
    );
    
    // キャッシュ更新
    revalidatePath('/', 'layout');
    
    return {
      status: 'success',
      message: '登録に成功しました',
      data
    };
    
  } catch (error) {
    console.error('Register error:', error);
    
    if (error instanceof ValidationError) {
      const firstError = error.errors ? Object.values(error.errors)[0] : null;
      const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      
      return {
        status: 'error',
        message: errorMessage || error.message,
        errors: error.errors
      };
    }
    
    return {
      status: 'error',
      message: error instanceof Error ? error.message : '登録に失敗しました'
    };
  }
}
*/
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