import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { cacheLife } from 'next/cache';
import { getCurrentUser } from '@/app/lib/auth';
import { updatePost } from '@/app/actions/posts';
import { PostDetail, POST_ENDPOINTS } from '@/types/post';
import { Category, CATEGORY_ENDPOINTS } from '@/types/category';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: '記事編集',
    description: `記事を編集: ${slug}`,
  };
}

// ▼ 1. カテゴリ取得
async function getCategories(): Promise<Category[]> {
  'use cache'
  cacheLife('days')

  try {
    const response = await fetch(`${apiUrl}${CATEGORY_ENDPOINTS.LIST}`, {
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

// ▼ 2. 記事詳細取得 (動的取得)
async function getPost(slug: string): Promise<PostDetail | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  try {
    const response = await fetch(`${apiUrl}${POST_ENDPOINTS.DETAIL(slug)}`, {
      headers: {
        'Cookie': cookieHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return null;
    const json = await response.json();
    return json.status === 'success' && json.data?.post ? json.data.post : null;
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return null;
  }
}

// ▼ 3. フォームコンポーネント
// 認証チェックとデータ取得を行い、フォームを表示
async function EditPostForm({ params }: { params: Promise<{slug: string }> }) {
  const { slug} =await  params;

  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  // データ並列取得 (動的データ + キャッシュ済みデータ)
  const [post, categories] = await Promise.all([
    getPost(slug),
    getCategories()
  ]);

  if (!post) {
    redirect('/dashboard/posts?error=記事が見つかりません');
  }

  // 権限チェック (AuthorIDの照合)
  const authorId = post.authorName.match(/Author(\d+)/)?.[1];
  if (authorId !== user.id.toString()) {
    redirect('/dashboard/posts?error=この記事を編集する権限がありません');
  }

  // Server Action (部分適用)
  async function updatePostAction(formData: FormData) {
    'use server';
    await updatePost(slug, formData);
  }

  return (
    <form action={updatePostAction} className="bg-white shadow rounded-lg p-6">
      {/* 記事メタ情報 */}
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
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

      {/* カテゴリー */}
      <div className="mb-6">
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
          カテゴリー
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={post.category?.id || ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">カテゴリーなし</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 本文 */}
      <div className="mb-6">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
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
        <p className="mt-1 text-sm text-gray-500">* HTMLタグが使用できます</p>
      </div>

      {/* ステータス */}
      <div className="mb-6">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
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
      </div>

      {/* ボタンエリア */}
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
  );
}

// ▼ 4. メインページコンポーネント
// Static Shell（ヘッダー部分）とDynamic Hole（フォーム部分）を分離
export default async function EditPostPage({ params }: PageProps) {

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Static Shell */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">記事編集</h1>
          <Link 
            href="/dashboard/posts"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </Link>
        </div>

        {/* Dynamic Hole: ストリーミング境界 */}
        <Suspense fallback={<EditFormSkeleton />}>
          <EditPostForm params={params} />
        </Suspense>
      </div>
    </div>
  );
}

// ▼ 5. スケルトンUI
function EditFormSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6 animate-pulse">
      <div className="h-24 bg-gray-100 rounded-lg"></div>
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
      <div className="flex gap-4 justify-end">
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}