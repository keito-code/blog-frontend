import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ログイン | Django Blog',
  description: 'ブログシステムにログイン',
};

interface LoginPageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // searchParamsを await で取得（Next.js 15）
  const params = await searchParams;
  const from = params.from || '/dashboard';

  const user = await getCurrentUser();

  if (user) {
    redirect(from);
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-8 text-center text-gray-800">
          ログイン
        </h1>

        {from !== '/dashboard' && (
          <div className="bg-blue-50 p-3 rounded mb-5 text-sm text-blue-700">
            ログイン後、元のページに戻ります
          </div>
        )}

        <LoginForm redirectTo={from} />

        <div className="mt-5 pt-5 border-t border-gray-200 text-center text-sm text-gray-600">
          アカウントをお持ちでない方は
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 ml-1"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}