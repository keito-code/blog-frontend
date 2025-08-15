'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi } from '@/lib/api/posts';
import { PostListItem } from '@/types/api';
import { useAuthStore } from '@/lib/store/authStore';

export default function PostsManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchMyPosts();
  }, [user, router]);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const data = await postsApi.getMyPosts();
      setPosts(data.results);
    } catch (error) {
      console.error('投稿の取得に失敗:', error);
      setError('投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: number) => {
    if (!confirm('この記事を公開しますか？')) return;
    
    try {
      await postsApi.publish(id);
      alert('記事を公開しました！');
      fetchMyPosts(); // リロード
    } catch (error) {
      const message = error instanceof Error ? error.message : '公開に失敗しました';
      alert('公開に失敗しました: ' + message);
    }
  };

  const handleUnpublish = async (id: number) => {
    if (!confirm('この記事を下書きに戻しますか？')) return;
    
    try {
      await postsApi.unpublish(id);
      alert('記事を下書きに戻しました');
      fetchMyPosts(); // リロード
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作に失敗しました';
      alert('操作に失敗しました: ' + message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この記事を削除しますか？この操作は取り消せません。')) return;
    
    try {
      await postsApi.delete(id);
      alert('記事を削除しました');
      fetchMyPosts(); // リロード
    } catch (error) {
      const message = error instanceof Error ? error.message : '削除に失敗しました';
      alert('削除に失敗しました: ' + message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '30px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            margin: 0
          }}>
            投稿管理
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/dashboard"
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              ← ダッシュボード
            </Link>
            <Link
              href="/dashboard/posts/new"
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              ＋ 新規投稿
            </Link>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* 投稿リスト */}
        {posts.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{
              fontSize: '18px',
              color: '#666',
              marginBottom: '20px'
            }}>
              まだ投稿がありません
            </p>
            <Link
              href="/dashboard/posts/new"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              最初の記事を作成する
            </Link>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {posts.map((post, index) => (
              <div
                key={post.id}
                style={{
                  padding: '20px',
                  borderBottom: index < posts.length - 1 ? '1px solid #e9ecef' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start'
                }}>
                  {/* 投稿情報 */}
                  <div style={{ flex: 1 }}>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      marginBottom: '10px',
                      color: '#333'
                    }}>
                      {post.title}
                    </h2>
                    
                    <div style={{
                      display: 'flex',
                      gap: '20px',
                      fontSize: '14px',
                      color: '#666'
                    }}>
                      <span>
                        📅 {new Date(post.created).toLocaleDateString('ja-JP')}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: post.status === 'published' ? '#d4edda' : '#fff3cd',
                        color: post.status === 'published' ? '#155724' : '#856404'
                      }}>
                        {post.status === 'published' ? '✅ 公開中' : '📝 下書き'}
                      </span>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    {/* 公開/非公開ボタン */}
                    {post.status === 'draft' ? (
                      <button
                        onClick={() => handlePublish(post.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        公開する
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnpublish(post.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ffc107',
                          color: '#333',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        下書きに戻す
                      </button>
                    )}

                    {/* 編集ボタン */}
                    <Link
                      href={`/dashboard/posts/${post.id}/edit`}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      編集
                    </Link>

                    {/* 削除ボタン */}
                    <button
                      onClick={() => handleDelete(post.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 投稿数の表示 */}
        {posts.length > 0 && (
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            全 {posts.length} 件の投稿
          </div>
        )}
      </div>
    </div>
  );
}