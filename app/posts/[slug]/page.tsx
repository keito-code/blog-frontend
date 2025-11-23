import { Suspense } from 'react';
import Link from 'next/link';
import { PostListItem, POST_ENDPOINTS } from '@/types/post';
import PostDetailContent from '../_components/PostDetailContent';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

// 全ての記事スラッグを取得して静的生成する
export async function generateStaticParams() {
  const response = await fetch(`${apiUrl}${POST_ENDPOINTS.LIST}`, {
    headers: { 'Accept': 'application/json' },
  });
  const json = await response.json();

  if (json.status !== 'success' || !json.data?.posts) return [];

  // { slug: 'example' } の形で返す
  return json.data.posts
    .filter((p: PostListItem) => p.status === 'published')
    .map((p: PostListItem) => ({ slug: p.slug }));
}

// paramsはPromiseでラップする
type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PostDetailPage({ params }: Props) {
  const resolvedParams = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー - 静的に生成される */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/posts"
           className="text-blue-500 hover:underline">
            ← 記事一覧に戻る
          </Link>
        </div>
      </header>

      {/* 記事コンテンツ - 動的にストリーミング */}
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
            <div className="h-6 w-20 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
            <div className="h-4 bg-gray-200 rounded mb-8 w-5/6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 rounded"></div>
              <div className="h-4 bg-gray-100 rounded"></div>
              <div className="h-4 bg-gray-100 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      }>
        <PostDetailContent slug={resolvedParams.slug} />
      </Suspense>
    </div>
  );
}
