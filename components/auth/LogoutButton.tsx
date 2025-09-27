'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import  { AUTH_ENDPOINTS } from '@/types/auth';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function LogoutButton({
  className = 'text-gray-700 hover:text-gray-900',
  children = 'ログアウト',
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // CSRFトークンをCookieから取得
  const getCSRFTokenFromCookie = (): string | null => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf_token') {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  const handleLogout = async () => {
    // 二重クリック防止
    if (isLoading) return;

    setIsLoading(true);
    try {
      // CSRFトークンを取得（HttpOnly=falseなので取得可能）
      const csrfToken = getCSRFTokenFromCookie();

      const response = await fetch(
        `${apiUrl}${AUTH_ENDPOINTS.LOGOUT}`,
        {
          method: 'POST',
          credentials: 'include', // Cookieを送る
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          body: JSON.stringify({}), // 空のJSONボディを送信
        }
      );
      
      // 401も成功として扱う（すでにログアウト済みの場合）
      if (response.ok || response.status === 401) {
        router.push('/auth/login');
        router.refresh();
      } else {
        console.error('Logout API error, status:', response.status);
        // エラーでも念のためログインページへ
        router.push('/auth/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // ネットワークエラーでも念のためログインページへ
      router.push('/auth/login');
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleLogout} disabled={isLoading} className={className}>
      {isLoading ? 'ログアウト中...' : children}
    </button>
  );
}