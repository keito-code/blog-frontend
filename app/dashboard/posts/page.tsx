import { Suspense } from 'react';
import Link from 'next/link';
import PostsManagementContent from './_components/PostsManagementContent';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PostsManagementPage({ searchParams }: PageProps) {

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">

        {/* 🚀 Static Shell: ヘッダーは即座に表示 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">投稿管理</h1>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← ダッシュボード
            </Link>
            <Link
              href="/dashboard/posts/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ＋ 新規投稿
            </Link>
          </div>
        </div>

        {/* 🟡 Dynamic Hole: リスト部分のみ待機 */}
        <Suspense fallback={
          <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-6 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        }>
          <PostsManagementContent searchParamsPromise={searchParams} />
        </Suspense>

      </div>
    </div>
  );
}