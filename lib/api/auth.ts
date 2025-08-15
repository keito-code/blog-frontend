import apiClient from '../axios';
import Cookies from 'js-cookie';

// 型定義
export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  lastName: string;
  firstName: string;
  email: string;
  username: string;
  password: string;
  passwordConfirmation: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  isStaff: boolean;
  lastName?: string;
  firstName?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// ログイン関数
export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login/', data);
    
    // トークンをCookieに保存
    // httpOnly にはできない（クライアントサイドから設定するため）
    Cookies.set('access_token', response.data.access, { 
      expires: 1, // 1日
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' // 本番環境ではhttps必須
    });
    
    Cookies.set('refresh_token', response.data.refresh, { 
      expires: 7, // 7日
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    return response.data;
  } catch (error: any) {
    // エラーメッセージを整形
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else {
      throw new Error('ログインに失敗しました');
    }
  }
};

// ログアウト関数
export const logout = async (): Promise<void> => {
  try {
    // バックエンドのログアウトエンドポイントを呼ぶ
    const refreshToken = Cookies.get('refresh_token');
    if (refreshToken) {
      await apiClient.post('/auth/logout/', {
        refresh: refreshToken
      });
    }
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Cookieを削除
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    
    // トップページへリダイレクト
    window.location.href = '/';
  }
};

// ユーザー情報取得
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/user/');
  return response.data;
};

// トークンリフレッシュ
export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = Cookies.get('refresh_token');
  
  if (!refreshToken) {
    throw new Error('リフレッシュトークンがありません');
  }
  
  const response = await apiClient.post<{ access: string }>('/auth/refresh/', {
    refresh: refreshToken
  });
  
  // 新しいアクセストークンを保存
  Cookies.set('access_token', response.data.access, {
    expires: 1,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  
  return response.data.access;
};

// トークン検証
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    await apiClient.post('/auth/verify/', { token });
    return true;
  } catch {
    return false;
  }
};

// 新規登録
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    // そのままcamelCaseで送信（自動変換される）
    const response = await apiClient.post<AuthResponse>('/auth/register/', data);
    
    // 登録成功後、自動的にトークンを保存
    Cookies.set('access_token', response.data.access, {
      expires: 1,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    Cookies.set('refresh_token', response.data.refresh, {
      expires: 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};