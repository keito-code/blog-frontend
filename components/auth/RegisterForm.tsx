'use client';

import { useState } from 'react';
import { AUTH_ENDPOINTS, RegisterRequest, CSRFTokenResponse } from '@/types/auth';
import { JSendResponse, isJSendSuccess } from '@/types/api';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCSRFToken = async (): Promise<string | null> => {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
          return decodeURIComponent(value);
        }
      }

      const response = await fetch(`${apiUrl}${AUTH_ENDPOINTS.CSRF}`, {
        method: 'GET',
        credentials: 'include',
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
    } catch (err) {
      console.error('Error getting CSRF token:', err);
      return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    // パスワード確認
    if (formData.password !== formData.passwordConfirmation) {
      setError('パスワードが一致しません');
      setIsSubmitting(false);
      return;
    }

    try {
      const csrfToken = await getCSRFToken();

      const requestBody: RegisterRequest = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation,
      };

      const response = await fetch(`${apiUrl}${AUTH_ENDPOINTS.REGISTER}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        window.location.href = '/dashboard';

      } else if (data.status === 'fail') {
        const errors = data.data
          ? Object.entries(data.data)
              .map(([field, messages]) => {
                const msgArray = Array.isArray(messages)
                  ? messages
                  : [String(messages)];
                return `${field}: ${msgArray.join(', ')}`;
              })
          .join('\n') : '入力内容に誤りがあります';
        setError(errors);
        setIsSubmitting(false);
      } else if (data.status === 'error') {
        setError(data.message || '登録に失敗しました');
        setIsSubmitting(false);
      } else {
        setError('登録に失敗しました');
        setIsSubmitting(false);
      }
    } catch {
      setError('ネットワークエラーが発生しました。');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          ユーザー名
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ユーザー名"
          required
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          メールアドレス
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="email@example.com"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          パスワード
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="パスワード（8文字以上）"
          required
          minLength={8}
          disabled={isSubmitting}
        />
      </div>

      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          パスワード（確認）
        </label>
        <input
          type="password"
          name="passwordConfirmation"
          value={formData.passwordConfirmation}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="パスワード（確認）"
          required
          minLength={8}
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-5 text-sm whitespace-pre-line">
          ⚠️ {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-3 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? '登録中...' : '新規登録'}
      </button>
    </form>
  );
}