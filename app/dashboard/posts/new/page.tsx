import Link from 'next/link';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cacheLife } from 'next/cache'; 
import { getCurrentUser } from '@/app/lib/auth';
import { createPost } from '@/app/actions/posts';
import { CATEGORY_ENDPOINTS, Category } from '@/types/category';

export const metadata: Metadata = {
  title: '新規投稿',
  description: '新しい記事を作成',
};

const API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

// ▼ 1. カテゴリ取得関数（キャッシュ設定）
async function getCategories(): Promise<Category[]> {
  'use cache'
  cacheLife('days')

  try {
    const response = await fetch(`${API_URL}${CATEGORY_ENDPOINTS.LIST}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return [];

    const json = await response.json();
    return json.status === 'success' && json.data?.categories ? json.data.categories : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// ▼ 2. フォームコンポーネント
async function NewPostForm() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const categories = await getCategories();

  return (
    <form action={createPost} className="bg-white shadow rounded-lg p-6">
      {/* タイトル */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          タイトル *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="記事のタイトルを入力"
        />
      </div>

      {/* カテゴリー選択 */}
      <div className="mb-6">
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
          カテゴリー
        </label>
        <select
          id="categoryId"
          name="categoryId"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">カテゴリーを選択（任意）</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">記事をカテゴリーに分類できます</p>
      </div>

      {/* 本文 */}
      <div className="mb-6">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          本文 *
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          placeholder="記事の内容を入力（Markdown対応）"
        />
        <p className="mt-1 text-sm text-gray-500">* Markdown記法が使えます</p>
      </div>

      {/* 公開設定 */}
      <div className="mb-6">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
          公開設定
        </label>
        <select
          id="status"
          name="status"
          defaultValue="draft"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="draft">下書き</option>
          <option value="published">公開</option>
        </select>
      </div>

      {/* ボタンエリア */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          投稿する
        </button>
        <Link
          href="/dashboard/posts"
          className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center justify-center text-gray-700"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}

// ▼ 3. メインページ & スケルトン
export default function NewPostPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">新規投稿</h1>
          <Link
            href="/dashboard/posts"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </Link>
        </div>

        <Suspense fallback={<FormSkeleton />}>
          <NewPostForm />
        </Suspense>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6 animate-pulse">
      <div>
        <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-10 w-full bg-gray-200 rounded"></div>
      </div>
      <div>
        <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-10 w-full bg-gray-200 rounded"></div>
      </div>
      <div>
        <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-64 w-full bg-gray-200 rounded"></div>
      </div>
      <div className="flex gap-4">
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}