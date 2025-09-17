'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Server Action: 記事を作成
export async function createPost(formData: FormData) {
  // アクションボタンの判定
  const action = formData.get('action');
  
  if (action === 'cancel') {
    redirect('/dashboard/posts');
  }

  // Cookieからアクセストークンを取得（サーバーサイド）
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('token')?.value || 
                      cookieStore.get('access_token')?.value;

  if (!accessToken) {
    redirect('/auth/login');
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
    // Django APIを直接呼び出し（サーバー間通信）
    const response = await fetch(`${process.env.DJANGO_API_URL}/api/v1/blog/posts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title,
        content,
        status,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      switch (response.status) {
        case 400:
          throw new Error(errorData.detail || '入力内容に誤りがあります');
        case 401:
          redirect('/auth/login');
        case 403:
          throw new Error('この操作を行う権限がありません');
        default:
          throw new Error('記事の作成に失敗しました');
      }
    }
    
    // キャッシュを更新
    revalidatePath('/dashboard/posts');
    revalidatePath('/');
    
    // 成功メッセージ付きでリダイレクト（既にエンコード済み）
    redirect(`/dashboard/posts?message=${encodeURIComponent(
      status === 'published' ? '記事を公開しました！' : '下書きを保存しました！'
    )}`);
    
  } catch (error) {
    // NEXT_REDIRECTは正常なリダイレクトなので再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    
    // 本当のエラーの場合のみログとリダイレクト
    console.error('Create post error:', error);
    
    if (error instanceof Error) {
      // エラーメッセージを含めてリダイレクト
      redirect(`/dashboard/posts/new?error=${encodeURIComponent(error.message)}`);
    }
    
    throw error;
  }
}

// Server Action: 記事を更新
export async function updatePost(slug: string, formData: FormData) {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('token')?.value || 
                      cookieStore.get('access_token')?.value;

  if (!accessToken) {
    redirect('/auth/login');
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const status = formData.get('status') as string;

  try {
    const response = await fetch(`${process.env.DJANGO_API_URL}/api/v1/blog/posts/${slug}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title,
        content,
        status,
      }),
    });

    if (!response.ok) {
      throw new Error('記事の更新に失敗しました');
    }

    // キャッシュを更新
    revalidatePath(`/dashboard/posts`);
    revalidatePath(`/posts/${slug}`);
    
    // エンコードを追加
    redirect(`/dashboard/posts?message=${encodeURIComponent('記事を更新しました')}`);
  } catch (error) {
    // NEXT_REDIRECTは正常なリダイレクトなので再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    
    // 本当のエラーの場合のみログとリダイレクト
    console.error('Update post error:', error);
    redirect(`/dashboard/posts?error=${encodeURIComponent('更新に失敗しました')}`);
  }
}

// Server Action: 記事を削除
export async function deletePost(slug: string) {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('token')?.value || 
                      cookieStore.get('access_token')?.value;
  
  if (!accessToken) {
    redirect('/auth/login');
  }

  try {
    const response = await fetch(`${process.env.DJANGO_API_URL}/api/v1/blog/posts/${slug}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('記事の削除に失敗しました');
    }

    // キャッシュを更新
    revalidatePath('/dashboard/posts');
    
    // エンコードを追加
    redirect(`/dashboard/posts?message=${encodeURIComponent('記事を削除しました')}`);
  } catch (error) {
    // NEXT_REDIRECTは正常なリダイレクトなので再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    
    // 本当のエラーの場合のみログとリダイレクト
    console.error('Delete post error:', error);
    redirect(`/dashboard/posts?error=${encodeURIComponent('削除に失敗しました')}`);
  }
}

// Server Action: 記事を公開
export async function publishPost(slug: string) {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('token')?.value || 
                      cookieStore.get('access_token')?.value;
  
  if (!accessToken) {
    throw new Error('認証が必要です');
  }

  try {
    const response = await fetch(`${process.env.DJANGO_API_URL}/api/v1/blog/posts/${slug}/publish/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '記事の公開に失敗しました');
    }

    // キャッシュを更新
    revalidatePath('/dashboard/posts');
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error('Publish error:', error);
    throw error;
  }
}

// Server Action: 記事を非公開（下書きに戻す）
export async function unpublishPost(slug: string) {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('token')?.value || 
                      cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('認証が必要です');
  }

  try {
    const response = await fetch(`${process.env.DJANGO_API_URL}/api/v1/blog/posts/${slug}/unpublish/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '記事の非公開に失敗しました');
    }

    // キャッシュを更新
    revalidatePath('/dashboard/posts');
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error('Unpublish error:', error);
    throw error;
  }
}