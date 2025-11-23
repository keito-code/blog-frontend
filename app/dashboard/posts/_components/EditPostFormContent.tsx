import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/app/actions/auth';
import { updatePost } from '@/app/actions/posts';
import { PostDetail, POST_ENDPOINTS } from '@/types/post';
import { Category, CATEGORY_ENDPOINTS } from '@/types/category';
import { cookies } from 'next/headers';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const response = await fetch(`${apiUrl}${POST_ENDPOINTS.DETAIL(slug)}`, {
      cache: 'no-store',
      headers:{
        'Cookie': cookieHeader,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch post:', response.status);
      return null;
    }

    const json = await response.json();

    if (json.status === 'success' && json.data?.post) {
      return json.data.post;
    }

    console.error('Invalid JSend response:', json);
    return null;
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return null;
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(
      `${apiUrl}${CATEGORY_ENDPOINTS.LIST}`,
      {
        next: { revalidate: 86400 },
        headers: { 'Accept': 'application/json'},
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

    console.error('Invalid JSend response:', json);
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

interface EditPostFormProps {
  paramsPromise: Promise<{ slug: string }>;
}

export default async function EditPostFormContent({ paramsPromise }: EditPostFormProps) {
  const { slug } = await paramsPromise;
  
  // 認証チェック
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // 記事データとカテゴリー一覧を並列で取得
  const [post, categories] = await Promise.all([
    getPostBySlug(slug),
    getCategories()
  ]);

  if (!post) {
    redirect('/dashboard/posts?error=記事が見つかりません');
  }

  // 作者チェック（authorNameは "Author{id}" 形式）
  // ユーザーIDを抽出して比較
  const authorId = post.authorName.match(/Author(\d+)/)?.[1];
  if (authorId !== user.id.toString()) {
    redirect('/dashboard/posts?error=この記事を編集する権限がありません');
  }

  // Server Action（部分適用）
  async function updatePostAction(formData: FormData) {
    'use server';
    await updatePost(slug, formData);
  }

  return (
    <>
      {/* 編集フォーム */}
      <form action={updatePostAction} className="bg-white shadow rounded-lg p-6">
        {/* 記事情報 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>記事ID: {post.id}</div>
            <div>作成者: {post.authorName}</div>
            <div>作成日: {new Date(post.createdAt).toLocaleDateString('ja-JP')}</div>
            <div>更新日: {new Date(post.updatedAt).toLocaleDateString('ja-JP')}</div>
          </div>
        </div>

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
            defaultValue={post.title}
            required
            minLength={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="記事のタイトルを入力（3文字以上）"
          />
        </div>

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
            defaultValue={post.category?.id || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">カテゴリーなし</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            現在のカテゴリー: {post.category ? post.category.name : 'なし'}
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
            defaultValue={post.content}
            required
            rows={20}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="記事の内容を入力"
          />
          <p className="mt-1 text-sm text-gray-500">
            * HTMLタグが使用できます
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
            defaultValue={post.status}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">下書き</option>
            <option value="published">公開</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            現在のステータス: {post.status === 'published' ? '公開中' : '下書き'}
          </p>
        </div>

        {/* ボタン */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/dashboard/posts"
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center"
          >
            キャンセル
          </Link>

          <button
            type="submit"
            className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            更新する
          </button>
        </div>
      </form>

    </>
  );
}
