'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (!confirm('ログアウトしますか？')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        router.push('/login');
        router.refresh(); // サーバーコンポーネントを再実行
      } else {
        alert('ログアウトに失敗しました');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      alert('ログアウトに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
    >
      {isLoading ? 'ログアウト中...' : 'ログアウト'}
    </button>
  );
}