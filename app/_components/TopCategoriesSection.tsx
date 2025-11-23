import Link from 'next/link';
import { CATEGORY_ENDPOINTS, CategoryListData } from '@/types/category';

const apiUrl = process.env.DJANGO_API_URL || 'http://localhost:8000';

// カテゴリー一覧を取得
async function getCategories(): Promise<CategoryListData | null> {
  try {
    const response = await fetch(
      `${apiUrl}${CATEGORY_ENDPOINTS.LIST}`,
      {
        next: { tags: ['categories'] },
        headers: {'Accept': 'application/json'},
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return null;
    }

    const json = await response.json();

    if (json.status === 'success' && json.data) {
      return json.data;
    }

    console.error('API error:', json);
    return null;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return null;
  }
}

export default async function TopCategoriesSection() {
  const categoriesData = await getCategories();
  const categories = categoriesData?.categories ?? [];

  // 投稿数が多い順に上位6件を取得
  const topCategories = [...categories]
    .sort((a, b) => b.postCount - a.postCount)
    .filter(cat => cat.postCount > 0)  // 投稿があるカテゴリーのみ
    .slice(0, 6);

  if (topCategories.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          カテゴリー
        </h2>
        <Link
          href="/categories"
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          すべてのカテゴリー →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {topCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="bg-gray-100 hover:bg-blue-50 rounded-lg px-4 py-3 text-center transition-colors"
          >
            <div className="font-medium text-gray-800">{category.name}</div>
            <div className="text-xs text-gray-600 mt-1">{category.postCount}件</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
