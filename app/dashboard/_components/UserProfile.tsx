import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export default async function UserProfile() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <>
      <h2 className="text-2xl font-semibold mb-5 text-gray-800">
        ようこそ、{user.username}さん！
      </h2>
      
      {/* アカウント情報 */}
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