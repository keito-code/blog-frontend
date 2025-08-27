import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '新規登録 | Django Blog',
  description: 'ブログシステムに新規登録',
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  
  if (user) {
    redirect('/dashboard');
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-8 text-center text-gray-800">
          新規登録
        </h1>
        
        <RegisterForm />
        
        <div className="mt-5 pt-5 border-t border-gray-200 text-center text-sm text-gray-600">
          すでにアカウントをお持ちの方は
          <Link href="/login" className="text-blue-600 hover:text-blue-700 ml-1">
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}