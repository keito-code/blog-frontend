import { Suspense } from 'react';
import Link from 'next/link';
import PostsContent from './_components/PostsContent';

export default function PostsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー - 静的に生成される */}
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

      {/* メインコンテンツ - 動的にストリーミング */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Suspense fallback={
          <div className="space-y-6">
            {/* スケルトンローディング */}
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 h-80 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-3 w-20"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                  <div className="mt-auto h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        }>
          <PostsContent />
        </Suspense>
      </main>
    </div>
  );
}
