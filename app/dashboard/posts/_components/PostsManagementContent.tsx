import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/app/lib/auth';
import { PostListItem } from '@/types/post';
import { USER_ENDPOINTS } from '@/types/user';
import { PostActions } from '@/components/posts/PostActions';
import { cookies } from 'next/headers';

// --- データ取得ロジック (変更なし) ---
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
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch posts:', response.status);
      return [];
    }

    const json = await response.json();

    if (json.status === 'success' && json.data?.posts) {
      return json.data.posts;
    }
    return [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

interface PostsManagementContentProps {
  searchParamsPromise: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PostsManagementContent({ searchParamsPromise }: PostsManagementContentProps) {
  const searchParams = await searchParamsPromise;
  const message = typeof searchParams.message === 'string' ? searchParams.message : undefined;
  const error = typeof searchParams.error === 'string' ? searchParams.error : undefined;

  // 1. 認証チェック (動的)
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // 2. データ取得 (動的・重い処理)
  const posts = await getMyPosts();

  // 3. レンダリング (リスト部分のみ)
  return (
    <>
      {/* 成功・エラーメッセージ (動的な結果なのでここに残してOK) */}
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

      {/* 投稿リスト (変更なし) */}
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