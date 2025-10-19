import { Suspense } from 'react';
import Link from 'next/link';
import {  POST_ENDPOINTS, PostListData } from '@/types/post';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

interface SearchParams {
  page?: string;
  pageSize?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

// データ取得関数
async function getPosts(params: SearchParams): Promise<PostListData | null> {
  const queryParams = new URLSearchParams({
    page: params.page || '1',
    pageSize: params.pageSize || '10',
    status: 'published'
  });

  try {
    const response = await fetch(
      `${apiUrl}${POST_ENDPOINTS.LIST}?${queryParams}`,
      {
        next: { revalidate: 3600, tags:['posts'] },
        headers: {'Accept': 'application/json'},
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch posts:', response.status);
      return null;
    }

    const json = await response.json();

    if (json.status === 'success' && json.data) {
      return json.data;
    }

    console.error('API error:', json);
    return null;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return null;
  }
}
    

// ローディングコンポーネント
function PostsLoading() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 記事リストコンポーネント
async function PostsList({ searchParams }: { searchParams: SearchParams }) {
  const data = await getPosts(searchParams);
  const posts = data?.posts ?? [];
  const pagination = data?.pagination;
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const totalPages = pagination?.totalPages ?? 0;
  const totalCount = pagination?.count ?? 0;
  
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">
          公開されている記事がまだありません
        </p>
      </div>
    );
  }
  
  return (
    <>
      {/* 検索結果の情報 */}
      <div className="mb-6 text-sm text-gray-600">
        <p>
          全 <span className="font-semibold">{totalCount}</span> 件中{' '}
          <span className="font-semibold">
            {(currentPage - 1) * pageSize + 1}
          </span> - {' '}
          <span className="font-semibold">
            {Math.min(currentPage * pageSize, totalCount)}
          </span> 件を表示
        </p>
      </div>
      
      {/* 記事リスト */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {posts.map((post) => (
          <article 
            key={post.id} 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col"
          >
            {/* カテゴリータグ（ホームページと統一） */}
            {post.category && (
              <Link
                href={`/categories/${post.category.slug}`}
                className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mb-3 hover:bg-blue-200 w-fit"
              >
                {post.category.name}
              </Link>
            )}

            {/* タイトル：2行固定 + 省略記号 */}
            <h3 className="text-xl font-bold text-gray-800 mb-3 
                           line-clamp-2 min-h-[3.5rem]">
              {post.title}
            </h3>

            {/* メタ情報：高さ固定 */}
            <div className="text-sm text-gray-600 mb-4 space-y-1">
              <p className="flex items-center gap-1">
                <span>👤</span>
                <span>{post.authorName}</span>
              </p>
              <p className="flex items-center gap-1">
                <span>📅</span>
                <time dateTime={post.createdAt}>
                  {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                </time>
              </p>
            </div>

            {/* ボタン：下部に固定 */}
            <Link 
              href={`/posts/${post.slug}`} 
              className="mt-auto w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors inline-block text-center"
            >
              記事を読む →
            </Link>
          </article>
        ))}
      </div>

      {/* シンプルなページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          {currentPage > 1 && (
            <Link
              href={`/posts?page=${currentPage - 1}`}
              className="px-4 py-2 bg-white border rounded hover:bg-gray-50"
            >
              ← 前へ
            </Link>
          )}
          
          <span className="text-gray-600">
            {currentPage} / {totalPages}
          </span>
          
          {currentPage < totalPages && (
            <Link
              href={`/posts?page=${currentPage + 1}`}
              className="px-4 py-2 bg-white border rounded hover:bg-gray-50"
            >
              次へ →
            </Link>
          )}
        </div>
      )}
    </>
  );
}

// メインページコンポーネント
export default async function PostsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">記事一覧</h1>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← トップページへ
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 検索は/searchページに任せる */}
        <div className="mb-6 flex justify-end">
          <Link 
            href="/search"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🔍 記事を検索
          </Link>
        </div>
        
        {/* 記事一覧（Suspense対応） */}
        <Suspense fallback={<PostsLoading />}>
          <PostsList searchParams={resolvedSearchParams} />
        </Suspense>
      </main>
    </div>
  );
}