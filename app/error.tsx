'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error('Error boundary caught:', error);
    
    // 本番環境ではエラー追跡サービスに送信
    if (process.env.NODE_ENV === 'production') {
      // 例: Sentry, LogRocket, etc.
      // logErrorToService(error);
    }
  }, [error]);

  // エラーメッセージの判定
  const getErrorMessage = () => {
    // API関連のエラー
    if (error.message?.includes('fetch')) {
      return 'サーバーとの通信に失敗しました。';
    }
    // 認証エラー
    if (error.message?.includes('認証') || error.message?.includes('auth')) {
      return 'ログインセッションの有効期限が切れた可能性があります。';
    }
    // デフォルト
    return '予期しないエラーが発生しました。';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* エラーアイコン */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        {/* エラータイトル */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          エラーが発生しました
        </h1>

        {/* エラーメッセージ */}
        <p className="text-gray-600 mb-8">
          {getErrorMessage()}
        </p>

        {/* デバッグ情報（開発環境のみ） */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left bg-gray-100 rounded-lg p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              エラー詳細（開発環境のみ）
            </summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
              {error.message}
              {error.stack && '\n\n' + error.stack}
              {error.digest && '\n\nDigest: ' + error.digest}
            </pre>
          </details>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" />
            再試行
          </button>
          
          <Link 
            href="/" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Home className="w-4 h-4" />
            トップへ戻る
          </Link>
        </div>

        {/* サポート情報 */}
        <p className="mt-8 text-sm text-gray-500">
          問題が続く場合は、しばらく時間をおいてから再度お試しください。
        </p>
      </div>
    </div>
  );
}