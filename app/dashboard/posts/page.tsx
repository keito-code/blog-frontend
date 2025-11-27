import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/app/lib/auth';
import { PostActions } from '@/components/posts/PostActions'; // Client Component
import { USER_ENDPOINTS } from '@/types/user';
import type { PostListItem } from '@/types/post';

// ==========================================
// 1. Static Shell (ページ全体)
// ==========================================

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function PostsManagementPage({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">

        {/* 🚀 ヘッダー (静的: 即座に表示) */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">投稿管理</h1>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← ダッシュボード
            </Link>
            <Link
              href="/dashboard/posts/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ＋ 新規投稿
            </Link>
          </div>
        </div>

        {/* 🟡 Dynamic Hole (動的: データ取得待ち) */}
        <Suspense
          fallback={
            <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-6 border-b border-gray-200">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          }
        >
          {/* searchParamsをプロップスとして渡す */}
          <PostList searchParamsPromise={searchParams} />
        </Suspense>

      </div>
    </div>
  );
}

// ==========================================
// 2. Dynamic Component (データ取得部分)
// ==========================================

async function PostList({ searchParamsPromise }: { 
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const searchParams = await searchParamsPromise;
  const message = typeof searchParams.message === 'string' ? searchParams.message : undefined;
  const error = typeof searchParams.error === 'string' ? searchParams.error : undefined;

  // 認証チェック
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // データ取得
  const posts = await getMyPosts();

  return (
    <>
      {/* メッセージ表示 */}
      {message && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">✅ {decodeURIComponent(message)}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">⚠️ {decodeURIComponent(error)}</p>
        </div>
      )}

      {/* リスト表示 */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-lg text-gray-600 mb-6">まだ投稿がありません</p>
          <Link
            href="/dashboard/posts/new"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            最初の記事を作成する
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  index < posts.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      {post.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <time dateTime={post.createdAt}>
                        📅 {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                      </time>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.status === 'published' ? '✅ 公開中' : '📝 下書き'}
                      </span>
                    </div>
                  </div>
                  {/* Client Component for Delete/Edit actions */}
                  <PostActions post={post} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center text-sm text-gray-600">
            全 {posts.length} 件の投稿
          </div>
        </>
      )}
    </>
  );
}

// ==========================================
// 3. Helper Functions
// ==========================================

async function getMyPosts(): Promise<PostListItem[]> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const response = await fetch(
      `${process.env.DJANGO_API_URL}${USER_ENDPOINTS.MY_POSTS}`,
      {
        headers: {
          'Cookie': cookieHeader,
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch posts:', response.status);
      return [];
    }

    const json = await response.json();
    return json.data?.posts || [];
    
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}