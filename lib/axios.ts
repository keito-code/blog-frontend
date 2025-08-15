import axios from 'axios';
import Cookies from 'js-cookie';

// Axiosインスタンスの作成
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒でタイムアウト
});

// リクエストインターセプター
// 全てのリクエストに自動的にトークンを付与
apiClient.interceptors.request.use(
  (config) => {
    // Cookieからトークンを取得
    const token = Cookies.get('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 開発環境のみログ出力
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => {
    // 開発環境のみログ出力
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    // 開発環境のみエラーログ出力
    if (process.env.NODE_ENV === 'development' && error.response) {
      console.error('❌ Response Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    }
    
    // 401 Unauthorized の場合
    if (error.response?.status === 401) {
      // トークンが無効な場合はログインページへ
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      
      // ログインページへリダイレクト（ルートページ以外で）
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;