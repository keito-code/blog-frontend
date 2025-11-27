'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { PostListData } from '@/types/post';
import { POST_ENDPOINTS } from '@/types/post';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface Props {
  initialData: PostListData | null;
}

export default function PostsClient({ initialData }: Props) {
  const searchParams = useSearchParams();

  // 初期値を保持
  const initialDataRef = useRef(initialData);

  const [data, setData] = useState<PostListData | null>(initialDataRef.current);

  useEffect(() => {
    const currentPage = Number(searchParams.get('page')) || 1;

    if (currentPage === 1) {
      setData(initialDataRef.current);
      return;
    }

    const controller = new AbortController();

    fetch(`${apiUrl}${POST_ENDPOINTS.LIST}?page=${currentPage}&pageSize=10&status=published`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    })
      .then((res) => res.json())
      .then((json) => setData(json.data ?? null))
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Fetch error:', err);
      });

    return () => controller.abort();
  }, [searchParams]);

  // ページ番号は必ずデータから取得（Hydration Mismatch防止の肝）
  const pagination = data?.pagination;
  const page = pagination?.page || 1; 
  
  const posts = data?.posts ?? [];
  const totalPages = pagination?.totalPages ?? 1;
  const totalCount = pagination?.count ?? 0;

  if (!data || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">公開されている記事がまだありません</p>
      </div>
    );
  }

  // リンク生成用のヘルパー関数
  const getPageLink = (p: number) => {
    return p === 1 ? '/posts' : `/posts?page=${p}`;
  };

  return (
    <>
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
                {/* ★日付のHydrationエラー対策を追加 */}
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
              href={getPageLink(page - 1)}
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
              href={getPageLink(page + 1)}
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