'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentPage = Number(searchParams.get('page')) || 1;

    if (currentPage === 1) {
      setPosts(initialPosts);
      return;
    }

    setLoading(true);

    fetch(`${apiUrl}${CATEGORY_ENDPOINTS.POSTS(slug)}?page=${currentPage}`, {
      headers: { Accept: 'application/json' },
    })
      .then((res) => res.json())
      .then((json: JSendResponse<CategoryPostsData>) => {
        if (json.status === 'success' && json.data?.posts) {
          setPosts(json.data.posts);
        }
      })
      .finally(() => setLoading(false));
  }, [searchParams.toString()]); // ✅クエリ変化を確実に検知

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
                href={`/categories/${post.category.slug}/`} // ✅ trailingSlash対応
                className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mb-3 hover:bg-blue-200 w-fit"
              >
                {post.category.name}
              </Link>
            )}

            <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 min-h-[3.5rem]">
              {post.title}
            </h3>

            <div className="text-sm text-gray-600 mb-4 space-y-1">
              <p>👤 {post.authorName}</p>
              <p>📅 {new Date(post.createdAt).toISOString().split('T')[0]}</p>
            </div>

            <Link
              href={`/posts/${post.slug}/`} // ✅ trailingSlash対応
              className="mt-auto w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors text-center"
            >
              記事を読む →
            </Link>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          {page > 1 && (
            <button
              onClick={() => {
                const newPage = page - 1;
                router.replace(
                  newPage === 1 ? `/categories/${slug}/` : `/categories/${slug}/?page=${newPage}`,
                  { scroll: true }
                );
              }}
              className="px-4 py-2 bg-white border rounded hover:bg-gray-50"
            >
              ← 前へ
            </button>
          )}
          <span className="text-gray-600">{page} / {totalPages}</span>
          {page < totalPages && (
            <button
              onClick={() => router.replace(`/categories/${slug}/?page=${page + 1}`, { scroll: true })}
              className="px-4 py-2 bg-white border rounded hover:bg-gray-50"
            >
              次へ →
            </button>
          )}
        </div>
      )}
    </>
  );
}