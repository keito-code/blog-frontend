import { Suspense } from 'react';
import Link from 'next/link';
import { PostListItem, POST_ENDPOINTS } from '@/types/post';
import { JSendResponse, PaginatedResponse, isJSendSuccess } from '@/types/api';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

interface SearchParams {
  page?: string;
  pageSize?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

// データ取得関数
async function getPosts(params: SearchParams): Promise<PaginatedResponse<PostListItem>> {
  const queryParams = new URLSearchParams({
    page: params.page || '1',
    pageSize: params.pageSize || '10',
    status: 'published'
  });

  try {
    const response = await fetch(
      `${apiUrl}${POST_ENDPOINTS.LIST}?${queryParams}`,
      {
        next: { revalidate: 3600 },
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch posts:', response.status);
      return { results: [], count: 0, next: null, previous: null };
    }

    const json: JSendResponse<PaginatedResponse<PostListItem>> = await response.json();

    if (isJSendSuccess(json)) {
      return json.data;
    }
    
    return { results: [], count: 0, next: null, previous: null };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { results: [], count: 0, next: null, previous: null };
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
async function PostsList({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const data = await getPosts(resolvedParams);
  const currentPage = Number(resolvedParams.page) || 1;
  const pageSize = Number(resolvedParams.pageSize) || 10;
  const totalPages = Math.ceil(data.count / pageSize);
  
  if (!data || data.results.length === 0) {
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
          全 <span className="font-semibold">{data.count}</span> 件中{' '}
          <span className="font-semibold">
            {(currentPage - 1) * pageSize + 1}
          </span> - {' '}
          <span className="font-semibold">
            {Math.min(currentPage * pageSize, data.count)}
          </span> 件を表示
        </p>
      </div>
      
      {/* 記事リスト */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {data.results.map((post) => (
          <article key={post.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
              {post.title}
            </h3>
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p>👤 {post.authorName}</p>
              <p>📅 {new Date(post.createdAt).toLocaleDateString('ja-JP')}</p>
            </div>
            <Link href={`/posts/${post.slug}`} className="mt-auto w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors inline-block text-center">
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
          <PostsList searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}