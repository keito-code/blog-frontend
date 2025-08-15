'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?from=/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await logout();
    }
  };

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '20px', margin: 0 }}>ダッシュボード</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#666' }}>👤 {user.username}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ログアウト
          </button>
        </div>
      </header>

      <main style={{
        padding: '30px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            marginBottom: '20px',
            color: '#333'
          }}>
            ようこそ、{user.username}さん！
          </h2>
          
          {/* 投稿管理リンクを追加 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <Link 
              href="/dashboard/posts/new"
              style={{
                display: 'block',
                padding: '25px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background-color 0.2s',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#bbdefb';
                e.currentTarget.style.borderColor = '#2196f3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                marginBottom: '10px',
                color: '#1976d2'
              }}>
                📝 新規投稿
              </h3>
              <p style={{ 
                margin: 0,
                color: '#666',
                fontSize: '14px'
              }}>
                新しい記事を作成
              </p>
            </Link>
            
            <Link 
              href="/dashboard/posts"
              style={{
                display: 'block',
                padding: '25px',
                backgroundColor: '#e8f5e9',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background-color 0.2s',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#c8e6c9';
                e.currentTarget.style.borderColor = '#4caf50';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e8f5e9';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                marginBottom: '10px',
                color: '#388e3c'
              }}>
                📚 投稿管理
              </h3>
              <p style={{ 
                margin: 0,
                color: '#666',
                fontSize: '14px'
              }}>
                あなたの記事を管理
              </p>
            </Link>
          </div>
          
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              marginBottom: '15px',
              color: '#666'
            }}>
              アカウント情報
            </h3>
            <p>ユーザー名: {user.username}</p>
            <p>メールアドレス: {user.email}</p>
            {user.lastName && user.firstName && (
              <p>氏名: {user.lastName} {user.firstName}</p>
            )}
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#d4edda',
            borderRadius: '4px',
            border: '1px solid #c3e6cb'
          }}>
            <p style={{ margin: 0, color: '#155724' }}>
              ✅ リロード対策が実装されました！<br />
              ページを更新してもログイン状態が維持されます。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}