'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

export default function SearchBox() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 500msのデバウンスでリアルタイム検索
  useEffect(() => {
    // 空の検索クエリの場合は何もしない
    if (!searchQuery.trim()) {
      setIsSearching(false);
      // 検索ページにいる場合はホームへ
      if (window.location.pathname === '/search') {
        router.push('/');
      }
      return;
    }

    // 検索中フラグを立てる
    setIsSearching(true);

    // 500ms後に検索実行
    const timer = setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      // 遷移後に検索中フラグを解除
      setTimeout(() => setIsSearching(false), 300);
    }, 500);

    // クリーンアップ（新しい入力があった場合はタイマーをリセット）
    return () => clearTimeout(timer);
  }, [searchQuery, router]);

  const handleClear = () => {
    setSearchQuery('');
    setIsSearching(false);
    // フォーカスを維持
    searchInputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Enterキーでの送信時は即座に検索
    if (searchQuery.trim()) {
      setIsSearching(true);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setTimeout(() => setIsSearching(false), 300);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="記事を検索..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        
        {/* 検索アイコン */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Search className={`w-5 h-5 transition-colors duration-200 ${
            isSearching ? 'text-blue-500 animate-pulse' : 'text-gray-400'
          }`} />
        </div>

        {/* クリアボタン */}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="検索をクリア"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 検索中のインジケーター */}
      {isSearching && (
        <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-500 animate-pulse rounded-full" />
      )}

      {/* 検索のヒント（2文字未満の場合） */}
      {searchQuery.length === 1 && (
        <p className="absolute -bottom-5 left-0 text-xs text-gray-500">
          2文字以上入力してください
        </p>
      )}
    </form>
  );
}