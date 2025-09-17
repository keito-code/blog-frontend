import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { getPostBySlug } from '@/lib/api/server/posts';
import { updatePost } from '@/app/actions/posts';

interface EditPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EditPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `記事編集 | My Blog`,
    description: `記事を編集: ${slug}`,
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  // Next.js 15のparams処理
  const { slug } = await params;
  
  // 認証チェック
  const { user } = await getAuthenticatedUser();
  if (!user) {
    redirect('/auth/login');
  }

  // 記事データを取得
  const post = await getPostBySlug(slug);
  
  if (!post) {
    redirect('/dashboard/posts?error=記事が見つかりません');
  }

  // 作者チェック
  if (post.author.username !== user.username) {
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
              <div>作成者: {post.author.username}</div>
              <div>作成日: {new Date(post.created).toLocaleDateString('ja-JP')}</div>
              <div>更新日: {new Date(post.updated).toLocaleDateString('ja-JP')}</div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="記事のタイトルを入力"
            />
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