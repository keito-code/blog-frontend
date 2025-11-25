import Link from 'next/link';
import { Suspense } from 'react';
import { getCurrentUser } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

/**
 * ① DashboardPage（PPR Static Shell）
 *    → cookies() を読まない
 *    → Suspense だけ置く
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-8 max-w-6xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm">

          {/* PPR Static Shell の中に入る fallback */}
          <Suspense
            fallback={
              <div className="h-40 bg-gray-100 animate-pulse rounded mb-8">
                ユーザー情報を読み込み中...
              </div>
            }
          >
            <DashboardRuntime />
          </Suspense>

          {/* 投稿管理リンク（Static Shell に含まれる） */}
          <DashboardLinks />

        </div>
      </main>
    </div>
  );
}

/**
 * ② DashboardRuntime（runtime data を扱う部分）
 *    → ここで getCurrentUser() を呼べば cookies() は prerender に侵入しない
 *    → Suspense 配下にあるため "request time only" 実行になる
 */
async function DashboardRuntime() {
  const user = await getCurrentUser(); // ← cookies() はここでだけ実行される

  if (!user) {
    redirect('/auth/login/?error=session_expired');
  }

  return <UserProfile user={user} />;
}

function UserProfile({ user }: { user: any }) {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-5 text-gray-800">
        ようこそ、{user.username}さん！
      </h2>

      <div className="bg-gray-50 p-5 rounded mb-5">
        <h3 className="text-base font-semibold mb-4 text-gray-600">
          アカウント情報
        </h3>
        <div className="space-y-1 text-gray-700">
          <p>ユーザー名: {user.username}</p>
          <p>メールアドレス: {user.email}</p>
          <p>登録日: {new Date(user.dateJoined).toLocaleDateString('ja-JP')}</p>
        </div>
      </div>
    </>
  );
}

/**
 * ④ Static なリンク部分（Static Shell の一部）
 */
function DashboardLinks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
      <Link
        href="/dashboard/posts/new"
        className="block p-6 bg-blue-50 rounded-lg border-2 border-transparent hover:bg-blue-100 hover:border-blue-500 transition-all group"
      >
        <h3 className="text-lg font-bold mb-2 text-blue-700">📝 新規投稿</h3>
        <p className="m-0 text-gray-600 text-sm">新しい記事を作成</p>
      </Link>

      <Link
        href="/dashboard/posts"
        className="block p-6 bg-green-50 rounded-lg border-2 border-transparent hover:bg-green-100 hover:border-green-500 transition-all group"
      >
        <h3 className="text-lg font-bold mb-2 text-green-700">📚 投稿管理</h3>
        <p className="m-0 text-gray-600 text-sm">あなたの記事を管理</p>
      </Link>
    </div>
  );
}
