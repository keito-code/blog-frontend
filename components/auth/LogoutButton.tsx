'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import  { AUTH_ENDPOINTS } from '@/types/auth';

const DJANGO_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    setIsLoading(true);
    try {
      // CSRFトークンを取得（HttpOnly=falseなので取得可能）
      const csrfToken = getCSRFTokenFromCookie();
      console.log('CSRF Token found:', csrfToken ? 'Yes' : 'No');

      const response = await fetch(
        `${DJANGO_API_URL}${AUTH_ENDPOINTS.LOGOUT}`,
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

      if (response.ok) {
        console.log('Logout successful');
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