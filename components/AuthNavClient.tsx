'use client'

import Link from 'next/link'
import { LogoutButton } from '@/components/auth/LogoutButton'
import type { PrivateUser } from '@/types/user'

interface AuthNavClientProps {
  user: PrivateUser | null
  loading?: boolean
}

export default function AuthNavClient({ user, loading = false }: AuthNavClientProps) {
  // ローディング中のスケルトン表示
  if (loading) {
    return (
      <div className="flex gap-3">
        <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
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
      <LogoutButton 
        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      />
    </div>
  )
}