import { Suspense } from 'react';
import SearchResults from '@/components/search/SearchResults';

export const dynamic = 'force-static'; 

export default async function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Suspense fallback={
        <div className="text-center py-16">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      }>
        <SearchResults />
      </Suspense>
    </div>
  );
}