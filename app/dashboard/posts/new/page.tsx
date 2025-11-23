import Link from 'next/link';
import { Metadata } from 'next';
import { Suspense } from 'react';
import NewPostFormContent from '../_components/NewPostFormContent';

export const metadata: Metadata = {
  title: '新規投稿',
  description: '新しい記事を作成',
};

export default function NewPostPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* 🚀 Static Shell: ヘッダーは即座に表示 */}
        {/* 編集ページと同じレイアウト（左にタイトル、右にキャンセル）に統一 */}
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold text-gray-800">新規投稿</h1>
           <Link 
             href="/dashboard/posts"
             className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
           >
             キャンセル
           </Link>
        </div>

        {/* 🟡 Dynamic Hole: フォーム部分のみ待機 */}
        <Suspense fallback={
          <div className="bg-white shadow rounded-lg p-6 space-y-6 animate-pulse">
            {/* タイトル入力欄 */}
            <div>
              <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded"></div>
            </div>

            {/* カテゴリー選択 */}
            <div>
              <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded"></div>
            </div>

            {/* 本文エリア (大きく確保) */}
            <div>
              <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-64 w-full bg-gray-200 rounded"></div>
            </div>

            {/* 下部ボタンエリア (左寄せ) */}
            <div className="flex gap-4">
              <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
              <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        }>
          <NewPostFormContent />
        </Suspense>
        
      </div>
    </div>
  );
}