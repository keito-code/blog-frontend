import axios from 'axios';
import apiClient from '../axios';
import { PostListItem, PostDetail, PaginatedResponse } from '@/types/api';

// エラーレスポンスの型定義
interface APIError {
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

// カスタムエラークラス
export class PostAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: APIError
  ) {
    super(message);
    this.name = 'PostAPIError';
  }
}

// 投稿作成用の型
export interface PostCreateInput {
  title: string;
  content: string;
  status?: 'draft' | 'published';
  publish?: string;
}

// 投稿更新用の型
export interface PostUpdateInput {
  title?: string;
  content?: string;
  status?: 'draft' | 'published';
  publish?: string;
}

// エラーハンドリングヘルパー
const handleError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
    // サーバーからのエラーレスポンス
    const status = error.response.status;
    const data = error.response.data;
    
    let message = 'エラーが発生しました';
    
    switch (status) {
      case 400:
        message = data.detail || '入力内容に誤りがあります';
        break;
      case 401:
        message = 'ログインが必要です';
        break;
      case 403:
        message = 'この操作を行う権限がありません';
        break;
      case 404:
        message = '記事が見つかりません';
        break;
      case 500:
        message = 'サーバーエラーが発生しました';
        break;
      default:
        message = data.detail || data.message || message;
    }
    
    throw new PostAPIError(message, status, data);
  } else if (error.request) {
    // リクエストは送信されたがレスポンスなし
    throw new PostAPIError('サーバーに接続できません', 0);
  } 
}
    // その他のエラー
    if (error instanceof Error) {
      throw new PostAPIError(error.message);
    }
    throw new PostAPIError('予期しないエラーが発生しました');
  };

export const postsApi = {
  // 記事一覧を取得
  getAll: async (params?: { 
    page?: number;
    search?: string; 
    status?: 'draft' | 'published';
    author?: string;
    ordering?: string;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      if (params?.author) {
        queryParams.append('author', params.author);
      }
      if (params?.ordering) {
        queryParams.append('ordering', params.ordering);
      }

      const { data } = await apiClient.get<PaginatedResponse<PostListItem>>(
        `/blog/posts/?${queryParams.toString()}`
      );
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // 記事詳細を取得
  getById: async (id: number | string) => {
    try {
      const { data } = await apiClient.get<PostDetail>(`/blog/posts/${id}/`);
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // スラッグで記事詳細を取得
  getBySlug: async (slug: string) => {
    try {
      const { data } = await apiClient.get<PaginatedResponse<PostListItem>>(
        `/blog/posts/?slug=${slug}`
      );
      if (data.results.length > 0) {
        return postsApi.getById(data.results[0].id);
      }
      throw new PostAPIError('記事が見つかりません', 404);
    } catch (error) {
      if (error instanceof PostAPIError) {
        throw error;
      }
      return handleError(error);
    }
  },

  // 記事を作成
  create: async (input: PostCreateInput) => {
    try {
      // バリデーション
      if (!input.title?.trim()) {
        throw new PostAPIError('タイトルを入力してください', 400);
      }
      if (!input.content?.trim()) {
        throw new PostAPIError('本文を入力してください', 400);
      }

      const { data } = await apiClient.post<PostDetail>('/blog/posts/', input);
      return data;
    } catch (error) {
      if (error instanceof PostAPIError) {
        throw error;
      }
      return handleError(error);
    }
  },

  // 記事を更新
  update: async (id: number | string, input: PostUpdateInput) => {
    try {
      // 空オブジェクトのチェック
      if (Object.keys(input).length === 0) {
        throw new PostAPIError('更新する内容がありません', 400);
      }

      const { data } = await apiClient.patch<PostDetail>(`/blog/posts/${id}/`, input);
      return data;
    } catch (error) {
      if (error instanceof PostAPIError) {
        throw error;
      }
      return handleError(error);
    }
  },

  // 記事を削除
  delete: async (id: number | string) => {
    try {
      await apiClient.delete(`/blog/posts/${id}/`);
    } catch (error) {
      return handleError(error);
    }
  },

  // 記事を公開
  publish: async (id: number | string) => {
    try {
      const { data } = await apiClient.post<PostDetail>(`/blog/posts/${id}/publish/`);
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // 記事を非公開
  unpublish: async (id: number | string) => {
    try {
      const { data } = await apiClient.post<PostDetail>(`/blog/posts/${id}/unpublish/`);
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // 自分の投稿一覧を取得
  getMyPosts: async (page = 1) => {
    try {
      const { data } = await apiClient.get<PaginatedResponse<PostListItem>>(
        `/blog/posts/my_posts/?page=${page}`
      );
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // 下書き一覧を取得
  getDrafts: async (page = 1) => {
    try {
      const { data } = await apiClient.get<PaginatedResponse<PostListItem>>(
        `/blog/posts/drafts/?page=${page}`
      );
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // 公開済み記事一覧を取得
  getPublished: async (page = 1) => {
    return postsApi.getAll({ page, status: 'published' });
  },

  // 記事を検索
  search: async (query: string, page = 1) => {
    return postsApi.getAll({ page, search: query });
  },
};