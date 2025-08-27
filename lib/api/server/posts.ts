// サーバー側でのみ使用するAPI関数

import { cookies } from 'next/headers';
import { PostListItem } from '@/types/api';

// 自分の投稿一覧を取得（サーバー側）
export async function getMyPosts(): Promise<PostListItem[]> {
  const cookieStore = await cookies();

  // 'token'と'access_token'の両方をチェック（互換性のため）
  const accessToken = cookieStore.get('token')?.value || 
                      cookieStore.get('access_token')?.value;
  
  if (!accessToken) {
    console.log('No token found');
    return [];
  }

  try {
    const response = await fetch(`${process.env.DJANGO_API_URL}/api/v1/blog/posts/my_posts/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      cache: 'no-store', // 常に最新データを取得
    });

    if (!response.ok) {
      console.error('Failed to fetch posts:', response.status);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// 記事詳細を取得（サーバー側）
export async function getPostBySlug(slug: string) {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('token')?.value || 
                      cookieStore.get('access_token')?.value;

  if (!accessToken) {
    console.log('No token found');
    return null;
  }

  try {
    const response = await fetch(`${process.env.DJANGO_API_URL}/api/v1/blog/posts/${slug}/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}