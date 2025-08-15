'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // アプリ起動時（リロード時）に認証状態をチェック
    checkAuth();
  }, [checkAuth]);

  // 初回ローディング中は全体でローディング表示
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #0070f3',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            marginTop: '20px',
            color: '#666'
          }}>
            Loading...
          </p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}