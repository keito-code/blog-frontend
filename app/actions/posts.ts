'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { POST_ENDPOINTS, PostDetail } from '@/types/post';
import { 
  JSendResponse, 
  isJSendSuccess, 
  isJSendFail, 
  isJSendError,
  ERROR_CODES,
  ActionResult 
} from '@/types/api';

const DJANGO_API_URL = process.env.DJANGO_API_URL;

// カスタムエラークラス定義
class AuthenticationError extends Error {
  constructor(message = '認証が必要です') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends Error {
  constructor(message = 'この操作を行う権限がありません') {
    super(message);
    this.name = 'AuthorizationError';
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
 * Djangoがログイン時にset_cookieで設定済みのものを使用
 */
async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrf_token')?.value;
  
  if (!csrfToken) {
    // CSRFトークンがない = 未ログイン or セッション切れ
    console.error('CSRFトークンが見つかりません');
    throw new AuthenticationError('CSRFトークンが見つかりません。ログインが必要です');
  }
  
  return csrfToken;
}

/**
 * 認証付きAPIリクエスト用の共通fetch関数
 * データ取得とエラー処理のみ行い、リダイレクトは呼び出し側で判断
 */
async function apiFetch<T = unknown>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  
  // CookieをHTTPヘッダー形式に変換
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');
  
  
  // メソッド判定（デフォルトはGET）
  const method = options.method?.toUpperCase() || 'GET';
  
  // state-changingメソッドの場合のみCSRFトークンを取得
  let csrfToken: string | undefined;
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    csrfToken = await getCSRFToken();
  }
  
  // デフォルトヘッダーを構築
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
      ...options.headers,  // カスタムヘッダーで上書き可能
    },
  });
  
  // 204 No Contentの場合
  if (response.status === 204) {
    return {} as T;
  }
  
  // Content-Typeの検証
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw new Error(`期待されないContent-Type: ${contentType || 'undefined'}`);
  }
  
  // レスポンスをJSendフォーマットとしてパース
  let data: JSendResponse<T>;
  try {
    data = await response.json();
  } catch (error) {
    console.error('JSONパースエラー:', error);
    throw new Error('APIレスポンスの解析に失敗しました');
  }
  
  // 401 Unauthorized - 認証エラー（リダイレクトせずエラーを投げる）
  if (response.status === 401 || 
      (isJSendError(data) && data.code === ERROR_CODES.UNAUTHORIZED)) {
    throw new AuthenticationError('認証が必要です');
  }
  
  // JSendフォーマットの処理
  if (isJSendSuccess(data)) {
    // 成功
    return data.data;
  } else if (isJSendFail(data)) {
    // バリデーションエラー
    const errors = Object.entries(data.data)
      .map(([field, messages]) => {
        const msgArray = Array.isArray(messages) ? messages : [messages];
        return `${field}: ${msgArray.join(', ')}`;
      })
      .join('; ');
    throw new ValidationError(`入力エラー: ${errors}`, data.data);
  } else if (isJSendError(data)) {
    // システムエラー
    switch (data.code) {
      case ERROR_CODES.FORBIDDEN:
        throw new AuthorizationError('この操作を行う権限がありません');
      case ERROR_CODES.NOT_FOUND:
        throw new Error('指定されたリソースが見つかりません');
      default:
        throw new Error(data.message || 'APIエラーが発生しました');
    }
  }
  
  // JSendフォーマット以外の場合（後方互換性）
  if (!response.ok) {
    throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
  }
  
  return data as unknown as T;
}

// Server Action: 記事を作成
export async function createPost(formData: FormData): Promise<void> {
  const action = formData.get('action');
  if (action === 'cancel') {
    redirect('/dashboard/posts');
  }

  // フォームデータを取得
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const status = formData.get('status') as string;

  // バリデーション
  if (!title?.trim()) {
    throw new Error('タイトルを入力してください');
  }
  if (!content?.trim()) {
    throw new Error('本文を入力してください');
  }

  try {
    await apiFetch<PostDetail>(POST_ENDPOINTS.CREATE, {
      method: 'POST',
      body: JSON.stringify({ title, content, status }),
    });
        
  } catch (error) {
    console.error('記事作成エラー:', error);
    
    // 認証エラーの場合は呼び出し側でリダイレクト判断
    if (error instanceof AuthenticationError) {
      throw new Error('認証が必要です。ログインしてください。');
    }
    
    // バリデーションエラー
    if (error instanceof ValidationError) {
      throw new Error(error.message);
    }

    throw new Error('記事の作成に失敗しました');
  }

  // 成功時の処理（try-catchの外）
  revalidatePath('/dashboard/posts');
  revalidatePath('/');
  redirect('/dashboard/posts');
}

// Server Action: 記事を更新
export async function updatePost(slug: string, formData: FormData): Promise<void> {
  const action = formData.get('action');
  if (action === 'cancel') {
    redirect('/dashboard/posts');
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const status = formData.get('status') as string;

  // バリデーション
  if (!title?.trim()) {
    throw new Error('タイトルを入力してください');
  }
  if (!content?.trim()) {
    throw new Error('本文を入力してください');
  }

  try {
    await apiFetch<PostDetail>(POST_ENDPOINTS.UPDATE(slug), {
      method: 'PATCH',
      body: JSON.stringify({ title, content, status }),
    });
    
  } catch (error) {
    console.error('記事更新エラー:', error);
    
    if (error instanceof AuthenticationError) {
      throw new Error('認証が必要です。ログインしてください。');
    }
    
    if (error instanceof ValidationError) {
      throw new Error(error.message);
    }

    throw new Error(
      error instanceof Error 
        ? error.message 
        : '記事の更新に失敗しました'
    );
  }

  // 成功時の処理
  revalidatePath('/dashboard/posts');
  revalidatePath(`/posts/${slug}`);
  revalidatePath('/');
  redirect('/dashboard/posts');
}

// Server Action: 記事を削除
export async function deletePost(slug: string): Promise<ActionResult<undefined>> {
  try {
    await apiFetch(POST_ENDPOINTS.DELETE(slug), {
      method: 'DELETE',
    });

    // 成功時：キャッシュを更新
    revalidatePath('/dashboard/posts');
    revalidatePath('/');
    
    return {
      status: 'success',
      message: '記事を削除しました',
      data: undefined
    };
    
  } catch (error) {
    console.error('記事削除エラー:', error);
    
    if (error instanceof AuthenticationError) {
      return {
        status: 'error',
        message: error.message,
      };
    }
    
    if (error instanceof AuthorizationError) {
      return {
        status: 'error',
        message: error.message
      };
    }
    
    return {
      status: 'error',
      message: error instanceof Error 
        ? error.message 
        : '記事の削除に失敗しました'
    };
  }
}

// Server Action: 記事のステータスを変更（公開/下書き）
export async function updatePostStatus(
  slug: string, 
  status: 'published' | 'draft'
): Promise<ActionResult<undefined>> {
  try {
    await apiFetch(POST_ENDPOINTS.UPDATE(slug), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    // 成功時：キャッシュを更新
    revalidatePath('/dashboard/posts');
    revalidatePath('/');
    revalidatePath(`/posts/${slug}`);
    
    return {
      status: 'success',
      message: status === 'published' 
        ? '記事を公開しました' 
        : '記事を非公開にしました',
      data: undefined
    };
    
  } catch (error) {
    console.error('ステータス更新エラー:', error);
    
    if (error instanceof AuthenticationError) {
      return {
        status: 'error',
        message: error.message,
      };
    }
    
    return {
      status: 'error',
      message: error instanceof Error 
        ? error.message 
        : 'ステータスの更新に失敗しました'
    };
  }
}

// Server Action: 記事を公開（便利メソッド）
export async function publishPost(slug: string): Promise<ActionResult<undefined>> {
  return updatePostStatus(slug, 'published');
}

// Server Action: 記事を非公開（便利メソッド）  
export async function unpublishPost(slug: string): Promise<ActionResult<undefined>> {
  return updatePostStatus(slug, 'draft');
}

// Server Action: 一括操作用（複数記事の削除）
export async function bulkDeletePosts(slugs: string[]): Promise<ActionResult<{
  success: string[];
  failed: Array<{ slug: string; error: string }>;
}>> {
  const results = {
    success: [] as string[],
    failed: [] as Array<{ slug: string; error: string }>,
  };
  
  for (const slug of slugs) {
    try {
      await apiFetch(POST_ENDPOINTS.DELETE(slug), {
        method: 'DELETE',
      });
      
      results.success.push(slug);
    } catch (error) {
      results.failed.push({
        slug,
        error: error instanceof Error ? error.message : '削除に失敗しました',
      });
    }
  }
  
  // キャッシュを更新
  if (results.success.length > 0) {
    revalidatePath('/dashboard/posts');
    revalidatePath('/');
  }
  
  const successCount = results.success.length;
  const failedCount = results.failed.length;
  
  return {
    status: failedCount === 0 ? 'success' : 'error',
    message: failedCount === 0
      ? `${successCount}件の記事を削除しました`
      : `${successCount}件削除成功、${failedCount}件失敗`,
    data: results
  };
}

// Server Action: 一括ステータス変更
export async function bulkUpdateStatus(
  slugs: string[], 
  status: 'published' | 'draft'
): Promise<ActionResult<{
  success: string[];
  failed: Array<{ slug: string; error: string }>;
}>> {
  const results = {
    success: [] as string[],
    failed: [] as Array<{ slug: string; error: string }>,
  };
  
  for (const slug of slugs) {
    try {
      await apiFetch(POST_ENDPOINTS.UPDATE(slug), {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      results.success.push(slug);
    } catch (error) {
      results.failed.push({
        slug,
        error: error instanceof Error ? error.message : 'ステータス変更に失敗しました',
      });
    }
  }
  
  // キャッシュを更新
  if (results.success.length > 0) {
    revalidatePath('/dashboard/posts');
    revalidatePath('/');
    results.success.forEach(slug => {
      revalidatePath(`/posts/${slug}`);
    });
  }
  
  const successCount = results.success.length;
  const failedCount = results.failed.length;
  const actionText = status === 'published' ? '公開' : '非公開に';
  
  return {
    status: failedCount === 0 ? 'success' : 'error',
    message: failedCount === 0
      ? `${successCount}件の記事を${actionText}しました`
      : `${successCount}件${actionText}成功、${failedCount}件失敗`,
    data: results
  };
}