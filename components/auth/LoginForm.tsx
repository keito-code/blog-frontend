'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_ENDPOINTS, LoginRequest, LoginResponse, CSRFTokenResponse } from '@/types/auth';
import { JSendResponse, isJSendSuccess, isJSendFail, isJSendError } from '@/types/api';

// 環境変数から取得（クライアント側なのでNEXT_PUBLIC_プレフィックスが必要）
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSRFトークンを取得
  const getCSRFToken = async (): Promise<string | null> => {
    try {
      // まず既存のCookieからCSRFトークンを探す
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
          return decodeURIComponent(value);
        }
      }

      // Cookieにない場合はDjangoから取得
      const response = await fetch(`${apiUrl}${AUTH_ENDPOINTS.CSRF}`, {
        method: 'GET',
        credentials: 'include', // Cookieを含める
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch CSRF token');
        return null;
      }

      const data: JSendResponse<CSRFTokenResponse> = await response.json();
      if (isJSendSuccess(data)) {
        return data.data.csrfToken;
      }
      return null;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // CSRFトークンを取得
      const csrfToken = await getCSRFToken();

      // ログインリクエストボディ（型定義を使用）
      const requestBody: LoginRequest = { email, password };

      // Django APIに直接リクエスト
      const response = await fetch(`${apiUrl}${AUTH_ENDPOINTS.LOGIN}`, {
        method: 'POST',
        credentials: 'include', // ブラウザが自動的にCookieを送信・保存
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        body: JSON.stringify(requestBody),
      });


      const data: JSendResponse<LoginResponse> = await response.json();

      if (response.ok && isJSendSuccess(data)) {
        
        // ブラウザがSet-Cookieヘッダーを自動的に処理
        // access_tokenとrefresh_tokenが自動的に保存される
        
        // ページをリフレッシュしてServer Componentを再実行
        router.push(redirectTo);
        router.refresh();
        
      } else if (isJSendFail(data)) {
        // バリデーションエラー
        const errors = Object.entries(data.data)
          .map(([field, messages]) => {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgArray.join(', ')}`;
          })
          .join('; ');
        setError(errors || 'ログイン情報が正しくありません');
        setPassword('');
      } else if (isJSendError(data)) {
        // サーバーエラー
        setError(data.message || 'ログインに失敗しました');
        setPassword('');
      } else {
        // 予期しないレスポンス
        setError('ログインに失敗しました');
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('ネットワークエラーが発生しました。しばらく経ってからお試しください。');
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          メールアドレス
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="email@example.com"
          required
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          パスワード
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-5 text-sm">
          ⚠️ {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  );
}