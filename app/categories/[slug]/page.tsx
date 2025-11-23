import { Suspense } from 'react';
import Link from 'next/link';
import { cacheLife, cacheTag } from 'next/cache'
import { notFound } from 'next/navigation';
import { CategoryDetailData, CategoryPostsData, CategoryListData, CATEGORY_ENDPOINTS } from '@/types/category';
import { JSendResponse } from '@/types/api';
import { CategoryClient } from '@/components/categories/CategoryClient';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

// ビルド時に全カテゴリの1ページ目を静的生成
export async function generateStaticParams() {
  try {
    const response = await fetch(`${apiUrl}${CATEGORY_ENDPOINTS.LIST}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return [];

    const json: JSendResponse<CategoryListData> = await response.json();
    const categories = json.status === 'success' ? json.data?.categories ?? [] : [];

    return categories.map((category) => ({
      slug: category.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
} 

async function getCategory(slug: string) {
  'use cache'
  cacheLife('max')
  cacheTag(`category-${slug}`)

  try {
    const response = await fetch(`${apiUrl}${CATEGORY_ENDPOINTS.DETAIL(slug)}`, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      console.error('Failed to fetch category:', response.status);
      return null;
    }

    const json: JSendResponse<CategoryDetailData> = await response.json();
    return json.status === 'success' ? json.data?.category ?? null : null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

async function getCategoryPosts(slug: string, page = 1, pageSize = 10) {
  'use cache'
  cacheLife('max')
  cacheTag(`category-${slug}`, 'posts')
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const response = await fetch(`${apiUrl}${CATEGORY_ENDPOINTS.POSTS(slug)}?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error('Failed to fetch category posts:', response.status);
      return null;
    }

    const json: JSendResponse<CategoryPostsData> = await response.json();
    return json.status === 'success' ? json.data ?? null : null;
  } catch (error) {
    console.error('Error fetching category posts:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPostsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const [category, postsData] = await Promise.all([
    getCategory(slug),
    getCategoryPosts(slug, 1),
  ]);

  if (!category) notFound();

  const posts = postsData?.posts ?? [];
  const pagination = postsData?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* パンくずリスト */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ホーム
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link href="/categories" className="text-blue-600 hover:text-blue-800">
              カテゴリー
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-700">{category.name}</li>
        </ol>
      </nav>

      {/* カテゴリー情報 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
        <p className="text-gray-600">
          {pagination?.count
            ? `${pagination.count} 件の記事`
            : 'このカテゴリーには記事がありません'}
        </p>
      </div>

      {/* 初回表示（ISR） + ページング部分（CSR） */}
      <Suspense fallback={<p className="text-center py-6 text-gray-600">読み込み中...</p>}>
        <CategoryClient
          slug={slug}
          initialPosts={posts}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  );
}