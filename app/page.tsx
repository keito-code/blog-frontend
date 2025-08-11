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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">My Blog</h1>
          <p className="text-gray-600 mt-2">Django + Next.js ポートフォリオ</p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">
            記事一覧 
            <span className="text-sm font-normal text-gray-500 ml-2">
              （{data.count || 0}件）
            </span>
          </h2>
        </div>

        {/* 記事カードのグリッド */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.results?.map((post: PostListItem) => (
            <article 
              key={post.id} 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="mb-3">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                  post.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {post.status === 'published' ? '公開済み' : '下書き'}
                </span>
              </div>

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
        {(!data.results || data.results.length === 0) && (
          <div className="text-center py-10 text-gray-500">
            記事が見つかりませんでした
          </div>
        )}
      </main>
    </div>
  );
}