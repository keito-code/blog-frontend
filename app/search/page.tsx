import Link from 'next/link';
import { Search, FileText, Calendar, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { sanitizeSearchQuery } from '@/lib/sanitize';

// 型定義はDjango側と同じ
interface Post {
  id: number;
  title: string;
  slug: string;
  author: string;
  status: 'draft' | 'published';
  publish: string;
  created: string;
  content?: string;
}

interface SearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Post[];
}

async function searchPosts(query: string): Promise<SearchResponse | { error: string }> {
  const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';
  
  // encodeURIComponentで十分（SQLインジェクションはDjango側で対策）
  const encodedQuery = encodeURIComponent(query);
  const url = `${apiUrl}/api/v1/blog/posts/?search=${encodedQuery}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
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

    const data = await response.json();
    
    // Django APIを信頼する（認証なしの場合、APIは公開記事のみ返すはず）
    // クライアント側でのフィルタリングは行わない
    
    // ただし、念のため型チェックとバリデーション
    if (!Array.isArray(data.results)) {
      console.error('Invalid API response: results is not an array');
      return { error: 'APIレスポンスの形式が不正です' };
    }
    
    return {
      count: data.count || data.results.length,
      next: data.next || null,
      previous: data.previous || null,
      results: data.results,
    };
  } catch (error) {
    console.error('Search error:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { error: 'APIサーバーに接続できません' };
    }
    
    return { error: '検索中に予期しないエラーが発生しました' };
  }
}

function generateExcerpt(content: string | undefined, maxLength: number = 150): string {
  if (!content) return '';
  
  // HTMLタグとMarkdown記法を除去してプレーンテキストに
  const plainText = content
    .replace(/<[^>]*>/g, '') // HTMLタグを除去
    .replace(/[#*`\[\]()]/g, '') // Markdown記法を除去
    .replace(/\n+/g, ' ') // 改行をスペースに
    .trim();
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // 単語の途中で切らないように調整
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = typeof params.q === 'string' ? params.q : '';
  
  // 表示用にサニタイズ（XSS対策）
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

  // 検索クエリの長さ制限（セキュリティ対策）
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

  const searchResults = searchResult as SearchResponse;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 検索ヘッダー */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          「<span className="break-all">{displayQuery}</span>」の検索結果
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {searchResults.count > 0 
              ? `${searchResults.count}件の記事が見つかりました`
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
      {searchResults.count > 0 ? (
        <div className="space-y-6">
          {searchResults.results.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <Link href={`/posts/${post.slug}`} className="block group">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {/* タイトルはDjango側でサニタイズ済み */}
                  {post.title}
                </h2>
              </Link>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {/* 著者名もDjango側でサニタイズ済み */}
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={post.publish}>
                    {new Date(post.publish).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </div>

              {post.content && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {generateExcerpt(post.content)}
                </p>
              )}

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
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            検索結果が見つかりませんでした
          </h2>
          <p className="text-gray-600 mb-6">
            別のキーワードで検索してみてください
          </p>
          <div className="space-y-2 max-w-sm mx-auto text-left">
            <p className="text-sm font-medium text-gray-700">検索のヒント：</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>キーワードを変更してみてください</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>より一般的な言葉で検索してみてください</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>スペルを確認してください</span>
              </li>
            </ul>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-8 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>トップページに戻る</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = typeof params.q === 'string' ? params.q : '';
  const displayQuery = sanitizeSearchQuery(rawQuery);

  if (!rawQuery) {
    return {
      title: '記事検索',
      description: 'ブログ記事を検索',
    };
  }

  return {
    title: `「${displayQuery}」の検索結果`,
    description: `「${displayQuery}」に関する記事の検索結果`,
  };
}