import { Suspense } from 'react';
import RecentPostsSection from './_components/RecentPostsSection';
import TopCategoriesSection from './_components/TopCategoriesSection';

// メインコンポーネント（Static Shell）
export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* タイトルセクション - 静的に生成される */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          PostLog
        </h1>
        <p className="text-gray-600">
          技術メモと日々の記録
        </p>
      </div>

      {/* 最新記事セクション - 動的にストリーミング */}
      <Suspense fallback={
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
          </div>
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
        <RecentPostsSection />
      </Suspense>

      {/* カテゴリーセクション - 動的にストリーミング */}
      <Suspense fallback={
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      }>
        <TopCategoriesSection />
      </Suspense>
    </div>
  );
}
