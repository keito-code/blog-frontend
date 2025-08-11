import Link from 'next/link';
import { PostDetail } from '@/types/api';
import { notFound } from 'next/navigation';

// データ取得関数
async function getPost(id: string) {
  try {
    const response = await fetch(
      `${process.env.DJANGO_API_URL || 'http://localhost:8000'}/api/v1/blog/posts/${id}/`,
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
export default async function PostDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const post: PostDetail | null = await getPost(id);

  if (!post) {
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

          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {post.comments && (
            <div className="mt-8 pt-8 border-t">
              <p className="text-gray-600">
                💬 コメント: {post.comments.length}件
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}