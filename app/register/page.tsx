'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    username: '',
    password: '',
    passwordConfirmation: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // 既にログイン済みならダッシュボードへ
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // バリデーション
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // メールアドレス
    if (!formData.email) {
      errors.email = 'メールアドレスは必須です';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'メールアドレスの形式が正しくありません';
    }
    
    // ユーザー名
    if (!formData.username) {
      errors.username = 'ユーザー名は必須です';
    } else if (formData.username.length < 3) {
      errors.username = 'ユーザー名は3文字以上必要です';
    }
    
    // パスワード
    if (!formData.password) {
      errors.password = 'パスワードは必須です';
    } else if (formData.password.length < 8) {
      errors.password = 'パスワードは8文字以上必要です';
    }
    
    // パスワード確認
    if (formData.password !== formData.passwordConfirmation) {
      errors.passwordConfirmation = 'パスワードが一致しません';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      await register(formData);
      // 成功したら自動的にログイン状態になり、useEffectでダッシュボードへリダイレクト
      alert('登録が完了しました！');
    } catch (error) {
      console.error('Registration failed:', error);
      // エラーはstoreで管理される
    } finally {
      setIsSubmitting(false);
    }
  };

  // 入力変更ハンドラー
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 入力時にエラーをクリア
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '30px',
          textAlign: 'center',
          color: '#333'
        }}>
          新規登録
        </h1>
        
        <form onSubmit={handleSubmit}>
          {/* 姓名（オプション） */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#555'
              }}>
                姓
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                placeholder="山田"
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#555'
              }}>
                名
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                placeholder="太郎"
              />
            </div>
          </div>

          {/* メールアドレス（必須） */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#555'
            }}>
              メールアドレス <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: validationErrors.email ? '1px solid #f44336' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder="example@email.com"
              required
            />
            {validationErrors.email && (
              <p style={{ 
                color: '#f44336', 
                fontSize: '12px', 
                marginTop: '5px',
                margin: '5px 0 0 0'
              }}>
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* ユーザー名（必須） */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#555'
            }}>
              ユーザー名 <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: validationErrors.username ? '1px solid #f44336' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder="username123"
              required
            />
            {validationErrors.username && (
              <p style={{ 
                color: '#f44336', 
                fontSize: '12px', 
                marginTop: '5px',
                margin: '5px 0 0 0'
              }}>
                {validationErrors.username}
              </p>
            )}
            <p style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '5px'
            }}>
              ※ ログイン時に使用します（3文字以上）
            </p>
          </div>

          {/* パスワード（必須） */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#555'
            }}>
              パスワード <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: validationErrors.password ? '1px solid #f44336' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder="8文字以上"
              required
            />
            {validationErrors.password && (
              <p style={{ 
                color: '#f44336', 
                fontSize: '12px', 
                marginTop: '5px',
                margin: '5px 0 0 0'
              }}>
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* パスワード確認（必須） */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#555'
            }}>
              パスワード（確認） <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="password"
              name="passwordConfirmation"
              value={formData.passwordConfirmation}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: validationErrors.passwordConfirmation ? '1px solid #f44336' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder="もう一度入力"
              required
            />
            {validationErrors.passwordConfirmation && (
              <p style={{ 
                color: '#f44336', 
                fontSize: '12px', 
                marginTop: '5px',
                margin: '5px 0 0 0'
              }}>
                {validationErrors.passwordConfirmation}
              </p>
            )}
          </div>

          {/* サーバーエラー表示 */}
          {error && (
            <div style={{
                backgroundColor: '#fee',
                color: '#c00',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '14px',
                border: '1px solid #fcc'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                ⚠️ 登録エラー
                </div>
                <div style={{ whiteSpace: 'pre-line' }}>  
                {error}
                </div>
            </div>
           )}

          {/* 利用規約（オプション） */}
          <div style={{
            marginBottom: '20px',
            fontSize: '12px',
            color: '#666',
            lineHeight: '1.5'
          }}>
            登録することで、利用規約とプライバシーポリシーに同意したものとみなされます。
          </div>

          {/* 送信ボタン */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isSubmitting ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isSubmitting ? '登録中...' : '登録する'}
          </button>
        </form>

        {/* ログインページへのリンク */}
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          textAlign: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          すでにアカウントをお持ちの方は
          <a 
            href="/login"
            style={{
              color: '#0070f3',
              textDecoration: 'none',
              marginLeft: '5px'
            }}
          >
            ログイン
          </a>
        </div>
      </div>
    </div>
  );
}