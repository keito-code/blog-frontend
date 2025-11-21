'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'; 
import Link from 'next/link';
import { CategoryPostsData, CATEGORY_ENDPOINTS } from '@/types/category';
import { JSendResponse } from '@/types/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CategoryClientProps {
  slug: string;
  initialPosts: CategoryPostsData['posts'];
  totalPages: number;
}

export function CategoryClient({ slug, initialPosts, totalPages }: CategoryClientProps) {
  // const router = useRouter(); // 不要
  const searchParams = useSearchParams();
  
  // ★修正: ページ番号はデータから取得する（Hydration Error対策）
  // const page = Number(searchParams.get('page')) || 1; // ← これはダメ

  // データの状態管理（ページ番号も含めるのがベストだが、今回は簡易的に実装）
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  
  // クライアントサイドでのページ番号管理
  // 初期値は必ず1（SSGと合わせる）
  const [currentPageNum, setCurrentPageNum] = useState(1);

  useEffect(() => {
    const pageParam = Number(searchParams.get('page')) || 1;
    setCurrentPageNum(pageParam); // URLが変わったら更新

    if (pageParam === 1) {
      setPosts(initialPosts);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`${apiUrl}${CATEGORY_ENDPOINTS.POSTS(slug)}?page=${pageParam}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((json: JSendResponse<CategoryPostsData>) => {
        if (json.status === 'success' && json.data?.posts) {
          setPosts(json.data.posts);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Fetch error:', err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [searchParams, slug, initialPosts]);

  // リンク生成ヘルパー
  const getPageLink = (p: number) => {
    return p === 1 
      ? `/categories/${slug}/` 
      : `/categories/${slug}/?page=${p}`;
  };

  if (loading) return <p className="animate-pulse text-center py-6 text-gray-500">読み込み中...</p>;
  if (!posts.length) return <p className="text-center py-6 text-gray-600">{slug} の記事がありません。</p>;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col"
          >
            {post.category && (
              <Link
                href={`/categories/${post.category.slug}/`}
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
                {/* ★修正: 日付のHydrationエラー対策 */}
                <time 
                  dateTime={post.createdAt}
                  suppressHydrationWarning={true}
                >
                  {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                </time>
              </p>
            </div>

            <Link
              href={`/posts/${post.slug}/`}
              className="mt-auto w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors text-center"
            >
              記事を読む →
            </Link>
          </article>
        ))}
      </div>

      {/* ページネーション (Link化) */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          {currentPageNum > 1 ? (
            <Link
              href={getPageLink(currentPageNum - 1)}
              className="px-4 py-2 bg-white border rounded hover:bg-gray-50"
              scroll={true}
            >
              ← 前へ
            </Link>
          ) : (
             <span className="px-4 py-2 invisible">← 前へ</span>
          )}
          
          <span className="text-gray-600">{currentPageNum} / {totalPages}</span>
          
          {currentPageNum < totalPages ? (
            <Link
              href={getPageLink(currentPageNum + 1)}
              className="px-4 py-2 bg-white border rounded hover:bg-gray-50"
              scroll={true}
            >
              次へ →
            </Link>
          ) : (
             <span className="px-4 py-2 invisible">次へ →</span>
          )}
        </div>
      )}
    </>
  );
}