import Link from 'next/link';
import { POST_ENDPOINTS, PostListItem, PostListData } from '@/types/post';
import { CATEGORY_ENDPOINTS, CategoryListData } from '@/types/category';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

// データ取得関数（最新6件のみ）
async function getRecentPosts(): Promise<PostListData | null> {
  const params = new URLSearchParams({
    status: 'published',
    pageSize: '6',
    ordering: '-createdAt' 
  });

  try {
    const response = await fetch(
      `${apiUrl}${POST_ENDPOINTS.LIST}?${params}`,
      {
        next: { revalidate: 3600 },
        headers:{
          'Accept': 'application/json',
        }
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

// カテゴリー一覧を取得
async function getCategories(): Promise<CategoryListData | null> {
  try {
    const response = await fetch(
      `${apiUrl}${CATEGORY_ENDPOINTS.LIST}`,
      {
        next: { revalidate: 3600 },
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return null;
    }

    const json = await response.json();

    if (json.status === 'success' && json.data) {
      return json.data;
    }
    
    console.error('API error:', json);
    return null;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return null;
  }
}

// メインコンポーネント
export default async function Home() {
  // 並列でデータ取得
  const [postsData, categoriesData] = await Promise.all([
    getRecentPosts(),
    getCategories()
  ]);

  const recentPosts = postsData?.posts ?? [];
  const totalCount = postsData?.pagination?.count ?? 0;
  const categories = categoriesData?.categories ?? [];
  // 投稿数が多い順に上位6件を取得
  const topCategories = [...categories]
    .sort((a, b) => b.postCount - a.postCount)
    .filter(cat => cat.postCount > 0)  // 投稿があるカテゴリーのみ
    .slice(0, 6);

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
          {totalCount > 6 && (
            <Link 
              href="/posts"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              すべての記事 →
            </Link>
          )}
        </div>

        {/* 記事カード */}
        {recentPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post: PostListItem) => (
              <article 
                key={post.id} 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col"
              >
                {/* カテゴリータグ */}
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
        ) : (
          <div className="text-center py-10 text-gray-500">
            公開されている記事がまだありません
          </div>
        )}
      </div>


      {/* カテゴリーセクション */}
      {topCategories.length > 0 && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">
              カテゴリー
            </h2>
            <Link 
              href="/categories"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              すべてのカテゴリー →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {topCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="bg-gray-100 hover:bg-blue-50 rounded-lg px-4 py-3 text-center transition-colors"
              >
                <div className="font-medium text-gray-800">{category.name}</div>
                <div className="text-xs text-gray-600 mt-1">{category.postCount}件</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}