import PostsClient from '@/components/posts/PostsClient';
import { POST_ENDPOINTS } from '@/types/post';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

export default async function PostsContent() {
  const response = await fetch(
    `${apiUrl}${POST_ENDPOINTS.LIST}?page=1&pageSize=10&status=published`,
    {
      next: { tags: ['posts'] },
      headers: { Accept: 'application/json' },
    }
  );

  if (!response.ok) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">記事の読み込みに失敗しました。</p>
      </div>
    );
  }

  const json = await response.json();
  const initialData = json?.data ?? null;

  return <PostsClient initialData={initialData} />;
}
