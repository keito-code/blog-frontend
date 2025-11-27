'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';
import { PostListItem, POST_ENDPOINTS } from '@/types/post';
import { sanitizeSearchQuery } from '@/utils/sanitize';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SearchResult {
  posts: PostListItem[];
  count: number;
}

export default function SearchResults() {
  const searchParams = useSearchParams();

  // Hydration回避: 初期値はサーバーとクライアントで一致させる
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // クライアント側でマウント確認
  useEffect(() => {
    setMounted(true);
  }, []);

  // URLから取得（マウント後のみ）
  const rawQuery = mounted ? (searchParams.get('q') || '') : '';
  const displayQuery = sanitizeSearchQuery(rawQuery);
  const page = mounted ? (Number(searchParams.get('page')) || 1) : 1;

  useEffect(() => {
    // マウント前はスキップ（Hydration回避）
    if (!mounted) return;

    const query = searchParams.get('q') || '';
    const currentPage = Number(searchParams.get('page')) || 1;

    // クエリが空または短すぎる場合はリセット
    if (!query || query.length < 2) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // クエリが長すぎる場合
    if (query.length > 100) {
      setData(null);
      setLoading(false);
      setError('検索キーワードが長すぎます（最大100文字）');
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          search: query,
          status: 'published',
          pageSize: '10',
          page: currentPage.toString(),
        });

        const url = `${apiUrl}${POST_ENDPOINTS.LIST}?${params}`;

        const response = await fetch(url, {
          cache: 'no-store', // ブラウザでキャッシュさせないため
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`検索中にエラーが発生しました (${response.status})`);
        }

        const json = await response.json();

        if (json.status === 'success' && json.data?.posts && json.data?.pagination) {
          setData({
            posts: json.data.posts,
            count: json.data.pagination.count,
          });
        } else if (json.status === 'fail') {
          setError('検索条件が不正です');
        } else if (json.status === 'error') {
          setError(json.message || 'サーバーエラーが発生しました');
        } else {
          setError('APIレスポンスの形式が不正です');
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Client fetch error:', err);
          setError('検索中に予期しないエラーが発生しました');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [mounted, searchParams]);

  // リンク生成ヘルパー
  const createPageLink = (newPage: number) => {
    const encodedQ = encodeURIComponent(rawQuery);
    return newPage === 1
      ? `/search?q=${encodedQ}`
      : `/search?q=${encodedQ}&page=${newPage}`;
  };

  // クエリが空または短い場合
  if (!rawQuery || rawQuery.length < 2) {
    return (
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
    );
  }

  // エラー
  if (error) {
    return (
      <>
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            「<span className="break-all">{displayQuery}</span>」の検索結果
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>トップページに戻る</span>
          </Link>
        </div>
      </>
    );
  }

  // ローディング中
  if (loading) {
    return (
      <>
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            「<span className="break-all">{displayQuery}</span>」の検索結果
          </h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // 結果なし
  if (!data || data.posts.length === 0) {
    return (
      <>
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            「<span className="break-all">{displayQuery}</span>」の検索結果
          </h1>
          <p className="text-gray-600">記事が見つかりませんでした</p>
        </div>
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
      </>
    );
  }

  // 検索結果表示
  const posts = data.posts ?? [];
  const totalCount = data.count ?? 0;
  const totalPages = Math.ceil(totalCount / 10);

  return (
    <>
      {/* ヘッダー */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          「<span className="break-all">{displayQuery}</span>」の検索結果
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {totalCount}件の記事が見つかりました
          </p>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            検索をクリア
          </Link>
        </div>
      </div>

      {/* 件数情報 */}
      <div className="mb-6 text-sm text-gray-600">
        <p>
          全 <span className="font-semibold">{totalCount}</span> 件中{' '}
          <span className="font-semibold">{(page - 1) * 10 + 1}</span> -{' '}
          <span className="font-semibold">{Math.min(page * 10, totalCount)}</span>{' '}
          件を表示
        </p>
      </div>

      {/* 記事リスト */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col"
          >
            {post.category && (
              <Link
                href={`/categories/${post.category.slug}`}
                className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mb-3 hover:bg-blue-200 w-fit"
              >
                {post.category.name}
              </Link>
            )}

            <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 min-h-[3.5rem]">
              {post.title}
            </h3>

            <div className="text-sm text-gray-600 mb-4 space-y-1">
              <p className="flex items-center gap-1">
                <span>👤</span>
                <span>{post.authorName}</span>
              </p>
              <p className="flex items-center gap-1">
                <span>📅</span>
                <time 
                  dateTime={post.createdAt}
                  suppressHydrationWarning={true}
                >
                  {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                </time>
              </p>
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

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          {page > 1 ? (
            <Link
              href={createPageLink(page - 1)}
              className="px-4 py-2 bg-white border rounded hover:bg-gray-50 transition-colors"
              scroll={true}
            >
              ← 前へ
            </Link>
          ) : (
             <span className="px-4 py-2 border border-transparent invisible">← 前へ</span>
          )}
          
          <span className="text-gray-600">
            {page} / {totalPages}
          </span>
          
          {page < totalPages ? (
            <Link
              href={createPageLink(page + 1)}
              className="px-4 py-2 bg-white border rounded hover:bg-gray-50 transition-colors"
              scroll={true}
            >
              次へ →
            </Link>
          ) : (
             <span className="px-4 py-2 border border-transparent invisible">次へ →</span>
          )}
        </div>
      )}
    </>
  );
}
