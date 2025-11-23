import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/app/actions/auth';
import { createPost } from '@/app/actions/posts';
import { CATEGORY_ENDPOINTS, Category } from '@/types/category';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(
      `${apiUrl}${CATEGORY_ENDPOINTS.LIST}`,
      {
        next: { revalidate: 86400 },
        headers: {'Accept': 'application/json'},
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return [];
    }

    const json = await response.json();

    if (json.status === 'success' && json.data?.categories) {
      return json.data.categories;
    }

    console.error('Failed to fetch categories:', json);
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function NewPostFormContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const categories = await getCategories();

  return (
    <form action={createPost} className="bg-white shadow rounded-lg p-6">
      
      {/* タイトル */}
      <div className="mb-6">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
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
        <label
          htmlFor="categoryId"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
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
        <p className="mt-1 text-sm text-gray-500">
          記事をカテゴリーに分類できます
        </p>
      </div>

      {/* 本文 */}
      <div className="mb-6">
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
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
        <p className="mt-1 text-sm text-gray-500">
          * Markdown記法が使えます
        </p>
      </div>

      {/* 公開設定 */}
      <div className="mb-6">
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
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
        <p className="mt-1 text-sm text-gray-500">
          下書きの場合、後から公開できます
        </p>
      </div>

      {/* ボタンエリア */}
      <div className="flex gap-4">
        <button
          type="submit"
          name="action"
          value="save"
          className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          投稿する
        </button>

        {/* キャンセルボタンをLinkに変更 */}
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