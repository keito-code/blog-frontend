'use client';

import { use, useState } from 'react';  // useを追加
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi, PostUpdateInput } from '@/lib/api/posts';
import { PostDetail } from '@/types/api';
import { useAuthStore } from '@/lib/store/authStore';

export default function EditPostPage({ 
  params 
}: { 
  params: Promise<{ id: string }>  // Promiseに変更
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // React.use()でparamsをアンラップ（警告対策）
  const { id } = use(params);
  
  const [post, setPost] = useState<PostDetail | null>(null);
  const [formData, setFormData] = useState<PostUpdateInput>({
    title: '',
    content: '',
    status: 'draft',
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // ログインチェック
  if (!user) {
    router.push('/login');
    return null;
  }

  // 初回のみデータ取得（useEffectなし）
  if (!isInitialized) {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const data = await postsApi.getById(id);  // idを使用（params.idではない）
        
        // 作者チェック
        if (data.author.username !== user.username) {
          alert('この記事を編集する権限がありません');
          router.push('/dashboard/posts');
          return;
        }
        
        setPost(data);
        setFormData({
          title: data.title,
          content: data.content,
          status: data.status,
        });
      } catch (error: any) {
        console.error('記事の取得に失敗:', error);
        setError('記事の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    setIsInitialized(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await postsApi.update(id, formData);  // idを使用
      alert('記事を更新しました！');
      router.push('/dashboard/posts');
    } catch (err: any) {
      setError(err.message || '更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">記事が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">記事を編集</h1>
          <Link
            href="/dashboard/posts"
            className="text-blue-600 hover:underline text-sm"
          >
            ← 投稿管理に戻る
          </Link>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 編集フォーム */}
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
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
              value={formData.title}
              onChange={handleChange}
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
              value={formData.content}
              onChange={handleChange}
              required
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="記事の内容を入力"
            />
            <p className="mt-1 text-sm text-gray-500">
              * Markdown記法が使えます（プレビューは実装予定）
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
              value={formData.status}
              onChange={handleChange}
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
            <button
              type="button"
              onClick={() => router.push('/dashboard/posts')}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? '更新中...' : '更新する'}
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