import Link from 'next/link';
import { Suspense } from 'react';
import EditPostFormContent from '../../_components/EditPostFormContent';

interface EditPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EditPostPageProps) {
  const resolvedParams = await params;
  return {
    title: `記事編集`,
    description: `記事を編集: ${resolvedParams.slug}`,
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold text-gray-800">記事編集</h1>
           <Link 
             href="/dashboard/posts"
             className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
           >
             キャンセル
           </Link>
        </div>

        <Suspense fallback={
          <div className="bg-white shadow rounded-lg p-6 space-y-6 animate-pulse">
          {/* 記事IDなどのメタ情報エリア */}
          <div className="h-24 bg-gray-100 rounded-lg"></div>

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

          {/* 下部ボタンエリア (右寄せ) */}
          <div className="flex gap-4 justify-end">
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      }>
        <EditPostFormContent paramsPromise={params} />
        </Suspense>
      </div>
    </div>
  );
}
