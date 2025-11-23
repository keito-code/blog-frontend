import { notFound } from 'next/navigation';
import { PostDetail, POST_ENDPOINTS } from '@/types/post';
import ServerMarkdownRenderer from '@/components/ServerMarkdownRenderer';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

// 単一記事を取得
async function getPost(slug: string): Promise<PostDetail | null> {
  try {
    const response = await fetch(`${apiUrl}${POST_ENDPOINTS.DETAIL(slug)}`,
    {
      next: { tags:[`post-${slug}`]},
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) return null;

    const json = await response.json();
    return json.status === 'success' ? json.data?.post ?? null : null;
  } catch {
    return null;
  }
}

interface PostDetailContentProps {
  slug: string;
}

export default async function PostDetailContent({ slug }: PostDetailContentProps) {
  const post = await getPost(slug);

  if (!post || post.status !== 'published') {
    notFound();
  }

  return (
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
          <div>👤 作成者: {post.authorName}</div>
          <div>📅 公開日: {new Date(post.createdAt).toLocaleDateString('ja-JP')}</div>
          <div>🔄 更新日: {new Date(post.updatedAt).toLocaleDateString('ja-JP')}</div>
        </div>

        {/* Markdownレンダリングに変更 */}
        <ServerMarkdownRenderer
          content={post.content}
        />
      </div>
    </article>
  );
}
