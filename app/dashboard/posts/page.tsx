import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/app/actions/auth';
import { PostListItem } from '@/types/post';
import { USER_ENDPOINTS } from '@/types/user';
import { PostActions } from '@/components/posts/PostActions';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getMyPosts(): Promise<PostListItem[]> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

try {
  const response = await fetch(
    `${process.env.DJANGO_API_URL}${USER_ENDPOINTS.MY_POSTS}`,
    {
      // 動的レンダリングでdefaultだが明示性のため
      cache: 'no-store',
      headers: {
        'Cookie': cookieHeader,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    console.error('Failed to fetch posts:', response.status);
    return [];
  }

  const json = await response.json();

  if (json.status === 'success' && json.data?.posts) {
    return json.data.posts;  // PostListItem[]
  }

  console.error('Invalid JSend response:', json);
    return [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// searchParamsを追加
interface PageProps {
  searchParams: Promise<{ message?: string; error?: string }>;
}

export default async function PostsManagementPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // サーバーサイドで投稿を取得
  const posts = await getMyPosts();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 成功メッセージ */}
        {params.message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✅ {decodeURIComponent(params.message)}
            </p>
          </div>
        )}
        
        {/* エラーメッセージ */}
        {params.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              ⚠️ {decodeURIComponent(params.error)}
            </p>
          </div>
        )}
        
        {/* ヘッダー */}
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

        {/* 投稿リスト */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-lg text-gray-600 mb-6">
              まだ投稿がありません
            </p>
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
                    {/* 投稿情報 */}
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">
                        {post.title}
                      </h2>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          📅 {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status === 'published' ? '✅ 公開中' : '📝 下書き'}
                        </span>
                      </div>
                    </div>

                    {/* アクションボタン（クライアントコンポーネント） */}
                    <PostActions post={post} />
                  </div>
                </div>
              ))}
            </div>

            {/* 投稿数の表示 */}
            <div className="mt-6 text-center text-sm text-gray-600">
              全 {posts.length} 件の投稿
            </div>
          </>
        )}
      </div>
    </div>
  );
}