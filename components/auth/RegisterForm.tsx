'use client';

import { useState } from 'react';
import { registerAction } from '@/app/actions/auth';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // パスワード確認
    if (formData.password !== formData.passwordConfirmation) {
      setError('パスワードが一致しません');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await registerAction(
        formData.username,
        formData.email,
        formData.password,
        formData.passwordConfirmation,
        '/dashboard'
      );
      
      if (result && !result.success) {
        setError(result.error || '登録に失敗しました');
      }
      // 成功時はServer Action内でリダイレクトされる
    } catch (error) {
      console.error('Register error:', error);
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
        <div className="bg-red-50 text-red-700 p-3 rounded mb-5 text-sm">
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