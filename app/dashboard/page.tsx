import Link from 'next/link';
import { Suspense } from 'react';
import UserProfile from './_components/UserProfile';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* メインコンテンツ */}
      <main className="p-8 max-w-6xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm">

          {/* データ取得中はfallbackが表示され、その間に下のリンク等は表示されます */}
          <Suspense fallback={<div className="h-40 bg-gray-100 animate-pulse rounded mb-8">ユーザー情報を読み込み中...</div>}>
             <UserProfile />
          </Suspense>
          
          {/* 投稿管理リンク */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <Link 
              href="/dashboard/posts/new"
              className="block p-6 bg-blue-50 rounded-lg border-2 border-transparent hover:bg-blue-100 hover:border-blue-500 transition-all group"
            >
              <h3 className="text-lg font-bold mb-2 text-blue-700">
                📝 新規投稿
              </h3>
              <p className="m-0 text-gray-600 text-sm">
                新しい記事を作成
              </p>
            </Link>
            
            <Link 
              href="/dashboard/posts"
              className="block p-6 bg-green-50 rounded-lg border-2 border-transparent hover:bg-green-100 hover:border-green-500 transition-all group"
            >
              <h3 className="text-lg font-bold mb-2 text-green-700">
                📚 投稿管理
              </h3>
              <p className="m-0 text-gray-600 text-sm">
                あなたの記事を管理
              </p>
            </Link>
          </div>
          
        </div>
      </main>
    </div>
  );
}