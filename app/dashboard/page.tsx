import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/app/actions/auth';
import { LogoutButton } from '@/components/auth/LogoutButton';


export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?from=/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold m-0">ダッシュボード</h1>
        <div className="flex items-center gap-5">
          <span className="text-gray-600">👤 {user.username}</span>
          <LogoutButton />
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="p-8 max-w-6xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-5 text-gray-800">
            ようこそ、{user.username}さん！
          </h2>
          
          {/* 投稿管理リンク */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <Link 
              href="/dashboard/posts/new"
              className="block p-6 bg-blue-50 rounded-lg border-2 border-transparent hover:bg-blue-100 hover:border-blue-500 transition-all group"
            >
              <h3 className="text-lg font-bold mb-2 text-blue-700">
                📝 新規投稿
              </h3>
              <p className="m-0 text-gray-600 text-sm">
                新しい記事を作成
              </p>
            </Link>
            
            <Link 
              href="/dashboard/posts"
              className="block p-6 bg-green-50 rounded-lg border-2 border-transparent hover:bg-green-100 hover:border-green-500 transition-all group"
            >
              <h3 className="text-lg font-bold mb-2 text-green-700">
                📚 投稿管理
              </h3>
              <p className="m-0 text-gray-600 text-sm">
                あなたの記事を管理
              </p>
            </Link>
          </div>
          
          {/* アカウント情報 */}
          <div className="bg-gray-50 p-5 rounded mb-5">
            <h3 className="text-base font-semibold mb-4 text-gray-600">
              アカウント情報
            </h3>
            <div className="space-y-1 text-gray-700">
              <p>ユーザー名: {user.username}</p>
              <p>メールアドレス: {user.email}</p>
              <p>登録日: {new Date(user.date_joined).toLocaleDateString('ja-JP')}</p>
            </div>
          </div>

          {/* 成功メッセージ */}
          <div className="p-5 bg-green-50 rounded border border-green-200">
            <p className="m-0 text-green-800">
              ✅ サーバーサイドレンダリング<br />
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}