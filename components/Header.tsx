'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PrivateUser, USER_ENDPOINTS } from '@/types/user';
import AuthNavClient from '@/components/AuthNavClient';
import SearchBox from '@/components/search/SearchBox';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Header() {
  const [user, setUser] = useState<PrivateUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // AbortControllerでfetchをキャンセル可能にする
    const controller = new AbortController();

    const fetchUser = async () => {
      try {
        const response = await fetch(`${apiUrl}${USER_ENDPOINTS.ME}`, {
          credentials: 'include',
          signal: controller.signal, //キャンセル可能にする
        });

         // 401の場合は未ログインとして扱う（エラーログを出さない）
         if (response.status === 401) {
          setUser(null);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          setUser(null);
          setLoading(false);
          return;
        }

        const json = await response.json();

        if (json.status === 'success' && json.data) {
          setUser(json.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        // AbortErrorは無視（コンポーネントのアンマウント時）
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // その他のエラーは静かに処理
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // クリーンアップ関数（コンポーネントのアンマウント時）
    return () => {
      controller.abort();
    };
  }, []);

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
            <AuthNavClient user={user} loading={loading} />
          </div>
        </div>
      </div>
    </header>
  );
}