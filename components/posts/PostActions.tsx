'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { publishPost, unpublishPost, deletePost } from '@/app/actions/posts';
import { PostListItem } from '@/types/post';

interface PostActionsProps {
  post: PostListItem;
}

export function PostActions({ post }: PostActionsProps) {
  const router = useRouter();

  const handlePublish = async () => {
    if (!confirm('この記事を公開しますか？')) return;
    
    try {
      await publishPost(post.slug);
      router.refresh(); // サーバーコンポーネントを再実行
    } catch (error) {
      // NEXT_REDIRECTは正常な動作なので無視
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        return;
      }
      // 本当のエラーの場合のみアラート
      console.error('Publish error:', error);
      alert('公開に失敗しました');
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('この記事を下書きに戻しますか？')) return;
    
    try {
      await unpublishPost(post.slug);
      router.refresh();
    } catch (error) {
      // NEXT_REDIRECTは正常な動作なので無視
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        return;
      }
      // 本当のエラーの場合のみアラート
      console.error('Unpublish error:', error);
      alert('操作に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!confirm('この記事を削除しますか？この操作は取り消せません。')) return;
    
    try {
      await deletePost(post.slug);
      router.refresh();
    } catch (error) {
      // NEXT_REDIRECTは正常な動作なので無視
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
        return;
      }
      // 本当のエラーの場合のみアラート
      console.error('Delete error:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="flex gap-2">
      {/* 公開/非公開ボタン */}
      {post.status === 'draft' ? (
        <button
          onClick={handlePublish}
          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
        >
          公開する
        </button>
      ) : (
        <button
          onClick={handleUnpublish}
          className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
        >
          下書きに戻す
        </button>
      )}

      {/* 編集ボタン */}
      <Link
        href={`/dashboard/posts/${post.slug}/edit`}
        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
      >
        編集
      </Link>

      {/* 削除ボタン */}
      <button
        onClick={handleDelete}
        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
      >
        削除
      </button>
    </div>
  );
}