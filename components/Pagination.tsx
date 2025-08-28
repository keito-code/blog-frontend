import Link from 'next/link';

interface SearchParams {
  page?: string;
  pageSize?: string;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams?: SearchParams;
  basePath?: string;
}

export default function Pagination({ 
  currentPage, 
  totalPages,
  searchParams = {},
  basePath = '/posts' 
}: PaginationProps) {
  
  // URLパラメータを保持しながらページを変更
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    
    // 既存のパラメータを保持（pageを除く）
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'page' && value) {
        params.set(key, value);
      }
    });
    
    // ページ番号を設定
    params.set('page', page.toString());
    
    return `${basePath}?${params.toString()}`;
  };
  
  // ページ番号の配列を生成
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // 表示する最大ページ数
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    // 開始位置の調整
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  // 1ページしかない場合は表示しない
  if (totalPages <= 1) return null;
  
  const pageNumbers = generatePageNumbers();
  
  return (
    <nav 
      className="flex justify-center items-center space-x-2 mt-8" 
      aria-label="ページネーション"
    >
      {/* 最初のページへ */}
      {currentPage > 2 && (
        <Link
          href={createPageUrl(1)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          aria-label="最初のページへ"
          prefetch={false}
        >
          «
        </Link>
      )}
      
      {/* 前のページへ */}
      {currentPage > 1 && (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          aria-label="前のページへ"
          prefetch={false}
        >
          ‹
        </Link>
      )}
      
      {/* 最初のページが表示されていない場合 */}
      {pageNumbers[0] > 1 && (
        <>
          <Link
            href={createPageUrl(1)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            prefetch={false}
          >
            1
          </Link>
          {pageNumbers[0] > 2 && (
            <span className="px-2 text-gray-500">...</span>
          )}
        </>
      )}
      
      {/* ページ番号 */}
      {pageNumbers.map(page => (
        page === currentPage ? (
          <span
            key={page}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md cursor-default"
            aria-current="page"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={createPageUrl(page)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            prefetch={false}
          >
            {page}
          </Link>
        )
      ))}
      
      {/* 最後のページが表示されていない場合 */}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-2 text-gray-500">...</span>
          )}
          <Link
            href={createPageUrl(totalPages)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            prefetch={false}
          >
            {totalPages}
          </Link>
        </>
      )}
      
      {/* 次のページへ */}
      {currentPage < totalPages && (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          aria-label="次のページへ"
          prefetch={false}
        >
          ›
        </Link>
      )}
      
      {/* 最後のページへ */}
      {currentPage < totalPages - 1 && (
        <Link
          href={createPageUrl(totalPages)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          aria-label="最後のページへ"
          prefetch={false}
        >
          »
        </Link>
      )}
    </nav>
  );
}