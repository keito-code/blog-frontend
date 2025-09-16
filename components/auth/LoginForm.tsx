'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions/auth';

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await loginAction(email, password, redirectTo);
      
      if (result && !result.success) {
        setError(result.error || 'ログインに失敗しました');
        setPassword(''); // 失敗時にパスワードをリセット
      }
      // 成功時はServer Action内でリダイレクトされる
    } catch (error) {
      console.error('Login error:', error);
      setError('ネットワークエラーが発生しました');
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