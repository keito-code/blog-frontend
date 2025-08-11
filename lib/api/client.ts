// lib/api/client.ts
import axios from 'axios';

// APIクライアントの作成
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// レスポンスインターセプター（エラー処理）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // エラーの詳細をコンソールに表示
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('認証が必要です');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;