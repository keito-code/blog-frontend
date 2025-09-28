import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { updatePost } from '@/app/actions/posts';
import { PostDetail, POST_ENDPOINTS } from '@/types/post';
import { Category, CATEGORY_ENDPOINTS } from '@/types/category';
import { JSendResponse, isJSendSuccess } from '@/types/api';
import { cookies } from 'next/headers';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

interface EditPostPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: EditPostPageProps): Promise<Metadata> {
  return {
    title: `記事編集 | My Blog`,
    description: `記事を編集: ${params.slug}`,
  };
}

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
      return null;
    }
    
    const data = await response.json();
    
    // JSend形式と直接オブジェクト形式の両方に対応
    if (data && typeof data === 'object') {
      if ('status' in data && data.status === 'success' && 'data' in data) {
        // JSend形式
        return data.data;
      } else if ('id' in data && 'slug' in data) {
        // 直接PostDetailオブジェクト
        return data as PostDetail;
      }
    }
    
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
        next: { revalidate: 3600 },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return [];
    }
    
    const json: JSendResponse<Category[]> = await response.json();
    
    if (isJSendSuccess(json)) {
      return json.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  // Next.js 15のparams処理
  const { slug } = await params;
  
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">記事を編集</h1>
          <a
            href="/dashboard/posts"
            className="text-blue-600 hover:underline text-sm"
          >
            ← 投稿管理に戻る
          </a>
        </div>

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
            <a
              href="/dashboard/posts"
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center"
            >
              キャンセル
            </a>
            
            <button
              type="submit"
              className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              更新する
            </button>
          </div>
        </form>

        {/* プレビューエリア（将来の実装用） */}
        <div className="mt-8 p-6 bg-gray-100 rounded-lg text-center text-gray-500">
          📝 プレビュー機能は後日実装予定
        </div>
      </div>
    </div>
  );
}