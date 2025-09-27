import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Category, CATEGORY_ENDPOINTS } from '@/types/category';
import { PostListItem } from '@/types/post';  
import { JSendResponse, PaginatedResponse, isJSendSuccess } from '@/types/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const response = await fetch(
      `${apiUrl}${CATEGORY_ENDPOINTS.DETAIL(slug)}`,
      {
        next: { revalidate: 3600 },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error('Failed to fetch category:', response.status);
      return null;
    }

    const json: JSendResponse<Category> = await response.json();
    
    if (isJSendSuccess(json)) {
      return json.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

async function getCategoryPosts(
  slug: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<PostListItem> | null> {  
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const response = await fetch(
      `${apiUrl}${CATEGORY_ENDPOINTS.POSTS(slug)}?${params}`,
      {
        next: { revalidate: 3600 },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch category posts:', response.status);
      return null;
    }

    const json: JSendResponse<PaginatedResponse<PostListItem>> = await response.json();
    
    if (isJSendSuccess(json)) {
      return json.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching category posts:', error);
    return null;
  }
}

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export default async function CategoryPostsPage({ params, searchParams }: PageProps) {
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = 10;

  // カテゴリー情報と投稿を並列で取得
  const [category, postsData] = await Promise.all([
    getCategory(params.slug),
    getCategoryPosts(params.slug, currentPage, pageSize),
  ]);

  if (!category) {
    notFound();
  }

  const posts = postsData?.results || [];
  const totalPages = postsData ? Math.ceil(postsData.count / pageSize) : 0;

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
          {postsData?.count === 0
            ? 'このカテゴリーには記事がありません'
            : `${postsData?.count || 0} 件の記事`
          }
        </p>
      </div>

      {/* 投稿一覧 */}
      {posts.length > 0 && (
        <>
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <Link href={`/posts/${post.slug}`}>
                  <h2 className="text-2xl font-bold mb-2 hover:text-blue-600">
                    {post.title}
                  </h2>
                </Link>
                
                {/* カテゴリータグ（既にカテゴリーページなので省略可） */}
                
                <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                  <div className="flex items-center space-x-4">
                    <span>投稿者: {post.authorName}</span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    続きを読む →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              {/* 前へボタン */}
              {currentPage > 1 && (
                <Link
                  href={`/categories/${params.slug}?page=${currentPage - 1}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  ← 前へ
                </Link>
              )}
              
              {/* ページ番号 */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Link
                      key={pageNum}
                      href={`/categories/${params.slug}?page=${pageNum}`}
                      className={`px-3 py-1 rounded ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>

              {/* 次へボタン */}
              {currentPage < totalPages && (
                <Link
                  href={`/categories/${params.slug}?page=${currentPage + 1}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  次へ →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}