import Link from 'next/link';
import { CategoryListData, CATEGORY_ENDPOINTS } from '@/types/category';
import { JSendResponse } from '@/types/api';

export const dynamic = 'force-static'; 

const apiUrl= process.env.DJANGO_API_URL || 'http://localhost:8000';

async function getCategories() {
  try {
    const response = await fetch(
      `${apiUrl}${CATEGORY_ENDPOINTS.LIST}`,
      {
        next: { tags: ['categories'] },
        headers: {'Accept': 'application/json'}
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return null;
    }

    const json: JSendResponse<CategoryListData> = await response.json();

    if (json.status === 'success' && json.data?.categories) {
      return json.data.categories;
    }
    
    console.error('API returned error:', json);
    return null;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return null;
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  if (!categories) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">カテゴリー</h1>
        <p className="text-gray-600">カテゴリーの読み込みに失敗しました。</p>
      </div>
    );
  }

  // 投稿数でソート（多い順）
  const sortedCategories = [...categories].sort((a, b) => b.postCount - a.postCount);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">カテゴリー</h1>
      
      {sortedCategories.length === 0 ? (
        <p className="text-gray-600">カテゴリーがまだ登録されていません。</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold">{category.name}</h2>
                {category.postCount > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {category.postCount}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  {category.postCount === 0 
                    ? '記事はありません'
                    : `${category.postCount !== undefined ? category.postCount : 0} 件の記事`
                  }
                </span>
                <span className="text-blue-600 hover:text-blue-800">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}