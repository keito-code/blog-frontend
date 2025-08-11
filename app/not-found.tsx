import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl md:text-3xl font-medium text-gray-600 mt-4">
          ページが見つかりません
        </h2>
        <p className="text-gray-500 mt-4 mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link 
          href="/" 
          className="inline-block bg-blue-500 text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}