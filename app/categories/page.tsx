// app/categories/page.tsx
import { Suspense } from 'react';
import CategoryListContent from './_components/CategoryListContent';

// 🚀 ここには async も await もデータ取得も書かない！
export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* ↓ これ（シェル）はビルド時に静的生成され、アクセスした瞬間表示される */}
      <h1 className="text-4xl font-bold mb-8">カテゴリー</h1>
      
      {/* ↓ データ取得が必要な部分だけ Suspense で囲む */}
      <Suspense fallback={
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {/* スケルトン表示 */}
           {[...Array(6)].map((_, i) => (
             <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg shadow-sm"></div>
           ))}
        </div>
      }>
        <CategoryListContent />
      </Suspense>
    </div>
  );
}