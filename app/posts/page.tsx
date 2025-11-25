import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache'
import Link from 'next/link';
import PostsClient from '@/components/posts/PostsClient';
import { POST_ENDPOINTS } from '@/types/post';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

// データ取得だけを別関数に切り出す
async function getCachedPosts() {
  'use cache'
  cacheLife('max')
  cacheTag('posts')

  // タイムアウト制御
  const controller = new AbortController();
  // 15秒待っても応答がなければ諦める（PCが遅いので長めに設定）
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `${apiUrl}${POST_ENDPOINTS.LIST}?page=1&pageSize=10&status=published`,
      { 
        headers: { Accept: 'application/json' },
        signal: controller.signal,
     }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const json =await response.json();
    return json?.data ?? null;

  } catch (error) {
    // タイムアウト発生時の処理
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⚠️ Build Warning: Data fetch timed out (Low Memory/Slow PC). Returning null to pass build.');
    } else {
      console.error('Fetch error:', error);
    }
    // エラーを投げずに null を返すことで、ビルド自体は成功させる
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function PostsPage() {
  // キャッシュされた関数を呼び出す
  const initialData = await getCachedPosts();

  // エラーハンドリング
  if (!initialData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">記事の読み込みに失敗しました。</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">記事一覧</h1>
            <Link href="/"
              className="text-blue-600 hover:text-blue-800 font-medium">
              ← トップページへ
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
      <Suspense fallback={<p className="text-center text-gray-500">読み込み中...</p>}>
        <PostsClient initialData={initialData} />
      </Suspense>
      </main>
    </div>
  );
}