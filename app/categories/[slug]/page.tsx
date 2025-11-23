// app/categories/[slug]/page.tsx
import { Suspense } from 'react';
import CategoryMainContent from './_components/CategoryMainContent';
import { JSendResponse } from '@/types/api';
import { CategoryListData, CATEGORY_ENDPOINTS } from '@/types/category';

// generateStaticParams はここに残す（ビルド時のパス生成用）
const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

export async function generateStaticParams() {
  try {
    const response = await fetch(`${apiUrl}${CATEGORY_ENDPOINTS.LIST}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const json: JSendResponse<CategoryListData> = await response.json();
    const categories = json.status === 'success' ? json.data?.categories ?? [] : [];
    return categories.map((c) => ({ slug: c.slug }));
  } catch { return []; }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPostsPage({ params }: PageProps) {
  const resolvedParams = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 🚀 Static Shell:
         この div コンテナだけがビルド時に静的生成されます。
         中身（パンくずや記事一覧）は Suspense でストリーミングされます。
      */}
      <Suspense fallback={
        <div className="space-y-4">
           {/* 簡易的なスケルトン */}
           <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
           <div className="h-10 w-48 bg-gray-200 animate-pulse rounded mt-4"></div>
           <div className="h-64 w-full bg-gray-100 animate-pulse rounded mt-8"></div>
           <p className="text-center text-gray-500">カテゴリー情報を読み込み中...</p>
        </div>
      }>
        <CategoryMainContent slug={resolvedParams.slug} />
      </Suspense>
    </div>
  );
}