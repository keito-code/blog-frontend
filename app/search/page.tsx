import Link from 'next/link';
import { Search, FileText, Calendar, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { sanitizeSearchQuery } from '@/utils/sanitize';
import { PostListItem, POST_ENDPOINTS } from '@/types/post';

// export const revalidate = 600;は機能しない。動的レンダリングだから
// Data Cacheするならfetchで設定する必要がある。

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

interface SearchResult {
  posts: PostListItem[];
  count: number;
}

async function searchPosts(query: string): Promise<SearchResult | { error: string }> {
  const params = new URLSearchParams({
    search: query,
    status: 'published',
    pageSize: '20'
  });
  
  const url = `${apiUrl}${POST_ENDPOINTS.LIST}?${params}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 600 },
      headers: {'Accept': 'application/json'},
    });

    if (!response.ok) {
      console.error('Search API error:', response.status, response.statusText);
      
      if (response.status === 404) {
        return { error: 'APIエンドポイントが見つかりません' };
      } else if (response.status >= 500) {
        return { error: 'サーバーエラーが発生しました' };
      } else {
        return { error: `検索中にエラーが発生しました (${response.status})` };
      }
    }

    const json = await response.json();

    if (json.status === 'success' && json.data?.posts && json.data?.pagination) {
      return {
        posts: json.data.posts,
        count: json.data.pagination.count
      };
    } else if (json.status === 'fail') {
      // バリデーションエラー
      console.error('Validation error:', json.data);
      return { error: '検索条件が不正です' };
    } else if (json.status === 'error') {
      // サーバーエラー
      console.error('Server error:', json.message);
      return { error: json.message || 'サーバーエラーが発生しました' };
    }
    
    // 予期しない形式
    console.error('Unexpected response format:', json);
    return { error: 'APIレスポンスの形式が不正です' };
  } catch (error) {
    console.error('Search error:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { error: 'APIサーバーに接続できません' };
    }
    
    return { error: '検索中に予期しないエラーが発生しました' };
  }
}

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = typeof params.q === 'string' ? params.q : '';
  
  // 表示用にサニタイズ
  const displayQuery = sanitizeSearchQuery(rawQuery);

  // クエリ長さチェック
  if (!rawQuery || rawQuery.length < 2) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-16">
          <Search className="w-20 h-20 mx-auto text-gray-300 mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">記事を検索</h1>
          <p className="text-gray-600 mb-8">
            検索ボックスに2文字以上のキーワードを入力してください
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>トップページに戻る</span>
          </Link>
        </div>
      </div>
    );
  }

  // 検索クエリの長さ制限
  if (rawQuery.length > 100) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">検索キーワードが長すぎます（最大100文字）</p>
        </div>
      </div>
    );
  }

  // 検索実行
  const searchResult = await searchPosts(rawQuery);

  // エラーハンドリング
  if ('error' in searchResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            「<span className="break-all">{displayQuery}</span>」の検索結果
          </h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                検索エラー
              </h2>
              <p className="text-red-700">{searchResult.error}</p>
              <p className="text-sm text-red-600 mt-2">
                しばらく時間をおいてから再度お試しください。
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>トップページに戻る</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 検索ヘッダー */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          「<span className="break-all">{displayQuery}</span>」の検索結果
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {searchResult.count > 0 
              ? `${searchResult.count}件の記事が見つかりました`
              : '記事が見つかりませんでした'
            }
          </p>
          <Link 
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            検索をクリア
          </Link>
        </div>
      </div>

      {/* 検索結果 */}
      {searchResult.count > 0 ? (
        <div className="space-y-6">
          {searchResult.posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <Link href={`/posts/${post.slug}`} className="block group">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
              </Link>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{post.authorName}</span>  {/* CamelCase */}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={post.createdAt}>
                    {new Date(post.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </div>

              <Link 
                href={`/posts/${post.slug}`}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                <FileText className="w-4 h-4" />
                <span>続きを読む</span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-6">
            「{displayQuery}」に一致する記事が見つかりませんでした
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• 別のキーワードで検索してみてください</p>
            <p>• より一般的な単語を使ってみてください</p>
          </div>
        </div>
      )}
    </div>
  );
}