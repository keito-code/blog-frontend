import { Suspense } from 'react';
import Link from 'next/link';
import PostsClient from '@/components/posts/PostsClient';
import { POST_ENDPOINTS } from '@/types/post';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

export const revalidate = 86400;

export default async function PostsPage() {
  // page=1のみ静的キャッシュ対象（ISR）
  const response = await fetch(
    `${apiUrl}${POST_ENDPOINTS.LIST}?page=1&pageSize=10&status=published`,
    {
      next: { revalidate: 86400, tags: ['posts'] },
      headers: { Accept: 'application/json' },
    }
  );

  if (!response.ok) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">記事の読み込みに失敗しました。</p>
      </div>
    );
  }

  const json = await response.json();
  const initialData = json?.data ?? null;

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
