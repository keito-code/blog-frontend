'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'
import type { User } from '@/types/auth'

interface AuthNavClientProps {
  user: User | null
}

export default function AuthNavClient({ user }: AuthNavClientProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await logoutAction()
    // Client側でナビゲーション制御
    router.push('/')
    router.refresh()
  }

  if (!user) {
    return (
      <div className="flex gap-3">
        <Link 
          href="/auth/login" 
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ログイン
        </Link>
        <Link 
          href="/auth/register" 
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          新規登録
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">👤 {user.username}</span>
      <Link 
        href="/dashboard" 
        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        ダッシュボード
      </Link>
      <Link
        href="/dashboard/posts/new"
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        ✏️ 新規投稿
      </Link>
      <button 
        onClick={handleLogout} 
        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        ログアウト
      </button>
    </div>
  )
}