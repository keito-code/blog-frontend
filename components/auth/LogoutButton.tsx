'use client';

import { useState } from 'react';
import { logoutAction } from '@/app/actions/auth';

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (!confirm('ログアウトしますか？')) return;
    
    setIsLoading(true);
    try {
      await logoutAction();
      // Server Action内でリダイレクトされるので、ここでは何もしない
    } catch (error) {
      console.error('Logout failed:', error);
      alert('ログアウトに失敗しました');
      setIsLoading(false);
    }
    // 成功時はリダイレクトされるのでsetIsLoading(false)は不要
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