import apiClient from './client';
import { PostListItem, PostDetail, PaginatedResponse } from '@/types/api';

export const postsApi = {
  // 記事一覧を取得（PostListItem型）
  getAll: async (page = 1) => {
    const { data } = await apiClient.get<PaginatedResponse<PostListItem>>(
      `/blog/posts/?page=${page}`
    );
    return data;
  },

  // 記事詳細を取得（PostDetail型）
  getById: async (id: string) => {
    const { data } = await apiClient.get<PostDetail>(`/blog/posts/${id}/`);
    return data;
  },

  // 記事を検索
  search: async (query: string) => {
    const { data } = await apiClient.get<PaginatedResponse<PostListItem>>(
      `/blog/posts/?search=${query}`
    );
    return data;
  },
};