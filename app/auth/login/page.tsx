import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'ログイン',
  description: 'ブログシステムにログイン',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-8 text-center text-gray-800">
          ログイン
        </h1>

        <LoginForm />

        <div className="mt-5 pt-5 border-t border-gray-200 text-center text-sm text-gray-600">
          アカウントをお持ちでない方は
          <Link
            href="/auth/register"
            className="text-blue-600 hover:text-blue-700 ml-1"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}