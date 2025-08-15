import Link from 'next/link';
import { PostListItem } from '@/types/api';

// データ取得関数（サーバーで実行）
async function getPosts() {
  try {
    const response = await fetch(
      `${process.env.DJANGO_API_URL || 'http://localhost:8000'}/api/v1/blog/posts/`,
      {
        next: { revalidate: 60 }  // 60秒ごとに再検証
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
  const data = await getPosts();

  // 公開済みの記事のみフィルタリング
  const publishedPosts = data.results?.filter(
    (post: PostListItem) => post.status === 'published'
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">
          記事一覧 
          <span className="text-sm font-normal text-gray-500 ml-2">
            （{publishedPosts.length}件）
          </span>
        </h2>
      </div>

      {/* 記事カードのグリッド */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {publishedPosts.map((post: PostListItem) => (
          <article 
            key={post.id} 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {post.title}
            </h3>

            <div className="text-sm text-gray-600 space-y-1">
              <p>👤 作成者: {post.author}</p>
              <p>📅 公開日: {new Date(post.publish).toLocaleDateString('ja-JP')}</p>
            </div>

            <Link 
              href={`/posts/${post.id}`}
              className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors inline-block text-center"
            >
              記事を読む →
            </Link>
          </article>
        ))}
      </div>

      {/* エラー/空の状態 */}
      {publishedPosts.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          公開されている記事がまだありません
        </div>
      )}
    </div>
  );
}