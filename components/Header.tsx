import Link from 'next/link';
import { getCurrentUser } from '@/app/actions/auth';
import AuthNavClient from './AuthNavClient';
import SearchBox from './search/SearchBox';

export default async function Header() {
  // Server Componentとして現在のユーザー情報を取得
  const user = await getCurrentUser();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer">
              My Blog
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-64">
              <SearchBox />
            </div>
            {/* Client Componentに認証状態とユーザー情報を渡す */}
            <AuthNavClient user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}