/**
 * カテゴリ関連の型定義
 * Django blog/アプリのCategoryモデルと一致
 * 
 * 注意: バックエンドはsnake_case、フロントエンドはcamelCaseに自動変換される
 */
import { PaginatedResponse } from './api';
import { PostListItem } from './post';

// ============================================
// カテゴリモデル
// ============================================

/**
 * CategorySerializer - 基本のカテゴリ型
 */
export interface Category {
    id: number;
    name: string;
    slug: string;
    postCount: number;
  }
    
  // ============================================
  // リクエスト型
  // ============================================
  
  /**
   * カテゴリ作成用（管理者のみ）
   * POST /v1/categories/
   */
  export interface CategoryCreateInput {
    name: string;
    // slugは自動生成されるため不要
  }
  
  /**
   * カテゴリ更新用（管理者のみ）
   * PATCH /v1/categories/{slug}/
   */
  export interface CategoryUpdateInput {
    name?: string;
  }

  // ============================================
// JSend レスポンスデータ型
// ============================================

/**
 * カテゴリ一覧APIレスポンスのdata部分
 * GET /v1/categories/
 */
export interface CategoryListData {
  categories: Category[];  // 複数形（ページネーションなし）
}

/**
 * カテゴリ詳細APIレスポンスのdata部分
 * GET /v1/categories/{slug}/
 */
export interface CategoryDetailData {
  category: Category;  // 単数形
}

/**
 * カテゴリ別記事一覧APIレスポンスのdata部分
 * GET /v1/categories/{slug}/posts/
 */
export interface CategoryPostsData {
  posts: PostListItem[];  // 複数形
  pagination: PaginatedResponse;
}
  
  // ============================================
  // エンドポイント定数
  // ============================================
  
  export const CATEGORY_ENDPOINTS = {
    LIST: '/v1/categories/',
    DETAIL: (slug: string) => `/v1/categories/${slug}/`,
    CREATE: '/v1/categories/',
    UPDATE: (slug: string) => `/v1/categories/${slug}/`,
    DELETE: (slug: string) => `/v1/categories/${slug}/`,
    POSTS: (slug: string) => `/v1/categories/${slug}/posts/`,  // カテゴリの投稿一覧
  } as const;