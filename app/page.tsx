import Link from 'next/link';
import { PostListItem } from '@/types/post';
import { POST_ENDPOINTS } from '@/types/post';

// データ取得関数（最新6件のみ）
async function getRecentPosts() {
  const baseUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';
  const params = new URLSearchParams({
    status: 'published',
    pageSize: '6'
  });

  try {
    const response = await fetch(
      `${baseUrl}${POST_ENDPOINTS.LIST}?${params}`,
      {
        next: { revalidate: 60 }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch posts:', response.status);
      return { results: [], count: 0 };
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { results: [], count: 0 };
  }
}

// サーバーコンポーネント
export default async function Home() {
  const data = await getRecentPosts();
  const recentPosts = data.results || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* タイトルセクション */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          MyBlog
        </h1>
        <p className="text-gray-600">
          技術メモと日々の記録
        </p>
      </div>

      {/* 最新記事セクション */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">
            最新の記事
          </h2>
          {data.count > 6 && (
            <Link 
              href="/posts"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              すべての記事を見る →
            </Link>
          )}
        </div>

        {/* 記事カード */}
        {recentPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post: PostListItem) => (
              <article 
                key={post.id} 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                  {post.title}
                </h3>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p>👤 {post.authorName}</p>
                  <p>📅 {new Date(post.createdAt).toLocaleDateString('ja-JP')}</p>
                </div>

                <Link 
                  href={`/posts/${post.slug}`}
                  className="mt-auto w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors inline-block text-center"
                >
                  記事を読む →
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            公開されている記事がまだありません
          </div>
        )}
      </div>

      {/* ナビゲーションセクション */}
      <div className="border-t pt-8 flex justify-center gap-4">
        <Link
          href="/posts"
          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          記事一覧
        </Link>
        <Link
          href="/posts?search="
          className="px-6 py-3 bg-white text-gray-800 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          記事を検索
        </Link>
      </div>
    </div>
  );
}