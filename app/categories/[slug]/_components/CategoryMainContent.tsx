import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryClient } from '@/components/categories/CategoryClient';
import { CategoryDetailData, CategoryPostsData, CATEGORY_ENDPOINTS } from '@/types/category';
import { JSendResponse } from '@/types/api';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

// API関数もこちらに移動（または別ファイルからimport）
async function getCategory(slug: string) {
  // ... (元のコードと同じ)
  try {
    const response = await fetch(`${apiUrl}${CATEGORY_ENDPOINTS.DETAIL(slug)}`, {
      next: { tags: [`category-${slug}`] },
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const json: JSendResponse<CategoryDetailData> = await response.json();
    return json.status === 'success' ? json.data?.category ?? null : null;
  } catch { return null; }
}

async function getCategoryPosts(slug: string, page = 1) {
  // ... (元のコードと同じ)
  try {
    const response = await fetch(`${apiUrl}${CATEGORY_ENDPOINTS.POSTS(slug)}?page=${page}`, {
      next: { tags: ['posts', `category-${slug}`] },
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const json: JSendResponse<CategoryPostsData> = await response.json();
    return json.status === 'success' ? json.data ?? null : null;
  } catch { return null; }
}

export default async function CategoryMainContent({ slug }: { slug: string }) {
  // ⏳ ここでデータ取得（このコンポーネントの中だけが待機状態になる）
  const [category, postsData] = await Promise.all([
    getCategory(slug),
    getCategoryPosts(slug, 1),
  ]);

  if (!category) notFound();

  const posts = postsData?.posts ?? [];
  const pagination = postsData?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <>
      {/* パンくずリスト (データ依存なのでここに移動) */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-blue-600 hover:text-blue-800">ホーム</Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link href="/categories" className="text-blue-600 hover:text-blue-800">カテゴリー</Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-700">{category.name}</li>
        </ol>
      </nav>

      {/* カテゴリー情報 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
        <p className="text-gray-600">
          {pagination?.count ? `${pagination.count} 件の記事` : 'このカテゴリーには記事がありません'}
        </p>
      </div>

      {/* クライアントコンポーネント */}
      <CategoryClient
        slug={slug}
        initialPosts={posts}
        totalPages={totalPages}
      />
    </>
  );
}