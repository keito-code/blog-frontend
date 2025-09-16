
//import { create } from 'zustand';
/*import { devtools } from 'zustand/middleware';
import type { User } from '@/lib/api/auth';
import * as authApi from '@/lib/api/auth';
import Cookies from 'js-cookie';
import axios from 'axios';

//interface AuthState {
  // 状態
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
///
  // アクション
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: authApi.RegisterData) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      // 初期状態
      user: null,
      isAuthenticated: false,
      isLoading: true, // 初回は読み込み中
      error: null,

      // ログイン
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ username, password });
          

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'ログインに失敗しました';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message 
          });
          throw error; // コンポーネント側でもエラーをキャッチできるように
        }
      },

      // ログアウト
      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {
        } finally {
          // エラーが起きても必ずクリア
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

  // 新規登録
  register: async (data: authApi.RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      
      // エラーメッセージの詳細な取得
      let errorMessage = '登録に失敗しました';

      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
      
      if (errorData && typeof errorData === 'object') {
        const errors: string[] = [];
        
        // フィールド名の日本語マッピング
        const fieldNames: Record<string, string> = {
          username: 'ユーザー名',
          email: 'メールアドレス',
          password: 'パスワード',
          passwordConfirmation: 'パスワード確認',
          lastName: '姓',
          firstName: '名',
          nonFieldErrors: ''
        };
        
        // エラーメッセージを整形
        for (const [field, messages] of Object.entries(errorData)) {
          
          if (Array.isArray(messages) && messages.length > 0) {
            const fieldName = fieldNames[field] || field;
            messages.forEach(msg => {
              if (fieldName) {
                errors.push(`${fieldName}: ${msg}`);
              } else {
                errors.push(String(msg));
              }
            });
          }
        }
        
        
        if (errors.length > 0) {
          errorMessage = errors.join('\n');
        }
      }
    }
      
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage  // ← ここでセット
      });
      
      throw error;
    }
  },

      checkAuth: async () => {
        const token = Cookies.get('access_token');
        
        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authApi.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch {
          // トークンが無効な場合
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      // エラークリア
      clearError: () => set({ error: null }),

      // ローディング状態設定
      setLoading: (loading: boolean) => set({ isLoading: loading })
    }),
    {
      name: 'auth-store' // DevTools用の名前
    }
  )
);
*/
// 代わりに型だけ定義
interface User {
  id: number;
  username: string;
  email: string;
}