'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-red-200">500</h1>
        <h2 className="text-2xl md:text-3xl font-medium text-gray-600 mt-4">
          エラーが発生しました
        </h2>
        <p className="text-gray-500 mt-4 mb-8">
          申し訳ございません。サーバーエラーが発生しました。
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="inline-block bg-blue-500 text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
          <Link 
            href="/" 
            className="inline-block bg-gray-500 text-white font-medium px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}