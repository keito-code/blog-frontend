// app/posts/[slug]/page.tsx
import Link from 'next/link';
import { PostDetail } from '@/types/api';
import { notFound } from 'next/navigation';
import ServerMarkdownRenderer from '@/components/ServerMarkdownRenderer';

// データ取得関数
async function getPost(slug: string): Promise<PostDetail | null> {
  try {
    const response = await fetch(
      `${process.env.DJANGO_API_URL || 'http://localhost:8000'}/api/v1/blog/posts/${slug}/`,
      {
        next: { revalidate: 60 }  // 60秒ごとに再検証
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// サーバーコンポーネント
type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PostDetailPage({ params }: Props) {

  const resolvedParams = await params; 
  const post = await getPost(resolvedParams.slug);

  if (!post || post.status !=='published') {
    notFound(); // 404ページへ
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-blue-500 hover:underline">
            ← 記事一覧に戻る
          </Link>
        </div>
      </header>

      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
              post.status === 'published' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {post.status === 'published' ? '公開済み' : '下書き'}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-8 pb-8 border-b">
            <div>👤 作成者: {post.author.username}</div>
            <div>📅 公開日: {new Date(post.publish).toLocaleDateString('ja-JP')}</div>
            <div>🔄 更新日: {new Date(post.updated).toLocaleDateString('ja-JP')}</div>
          </div>

          {/* Markdownレンダリングに変更 */}
          <ServerMarkdownRenderer 
            content={post.content}
            // sanitize={true} はデフォルトなので省略可
          />

          {/* コメント機能（API実装後に有効化） */}
          {post.comments && post.comments.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <p className="text-gray-600 mb-4">
                💬 コメント: {post.comments.length}件
              </p>
              {/* TODO: コメント表示機能はAPI実装後に追加 */}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}