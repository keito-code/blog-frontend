'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      lastName: formData.get('lastName') as string,
      firstName: formData.get('firstName') as string,
      email: formData.get('email') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      passwordConfirmation: formData.get('passwordConfirmation') as string,
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(result.error || '登録に失敗しました');
      }
    } catch {
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 姓 */}
      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          姓
        </label>
        <input 
          name="lastName" 
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>

      {/* 名 */}
      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          名
        </label>
        <input 
          name="firstName" 
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>
      
      {/* メールアドレス */}
      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          メールアドレス <span className="text-red-500">*</span>
        </label>
        <input 
          name="email" 
          type="email" 
          required 
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>
      
      {/* ユーザー名 */}
      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          ユーザー名 <span className="text-red-500">*</span>
          <span className="text-xs text-gray-500 ml-1">(3文字以上)</span>
        </label>
        <input 
          name="username" 
          type="text"
          required 
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>
      
      {/* パスワード */}
      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          パスワード <span className="text-red-500">*</span>
          <span className="text-xs text-gray-500 ml-1">(8文字以上)</span>
        </label>
        <input 
          name="password" 
          type="password" 
          required 
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>
      
      {/* パスワード確認 */}
      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          パスワード（確認）<span className="text-red-500">*</span>
        </label>
        <input 
          name="passwordConfirmation" 
          type="password" 
          required 
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-5 text-sm">
          ⚠️ {error}
        </div>
      )}
      
      {/* 送信ボタン */}
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? '登録中...' : '登録する'}
      </button>
    </form>
  );
}