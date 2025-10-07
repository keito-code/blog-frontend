/**
 * 投稿関連の型定義
 * Django blog/アプリのSerializerと一致
 * 
 * 注意: バックエンドはsnake_case、フロントエンドはcamelCaseに自動変換される
 */

import { Category } from './category';
import { PaginatedResponse } from './api';


// ============================================
// 投稿モデル
// ============================================

/**
 * PostListSerializer - 記事一覧用
 * GET /v1/posts/ のレスポンス
 */
export interface PostListItem {
  id: number;
  title: string;
  slug: string;
  authorName: string;  // "Author{id}"形式で匿名化
  category: Category | null;
  status: 'draft' | 'published';
  createdAt: string;  // ISO 8601形式
  updatedAt: string;  // ISO 8601形式
}

/**
 * PostDetailSerializer - 記事詳細用
 * GET /v1/posts/{slug}/ のレスポンス
 */
export interface PostDetail {
  id: number;
  title: string;
  slug: string;
  authorName: string;  // "Author{id}"形式で匿名化
  category: Category | null;
  content: string;    // サニタイズ済みのHTML
  status: 'draft' | 'published';
  createdAt: string;  // ISO 8601形式
  updatedAt: string;  // ISO 8601形式
}

// ============================================
// リクエスト型
// ============================================

/**
 * PostCreateSerializer - 記事作成用
 * POST /v1/posts/ のリクエストボディ
 */
export interface PostCreateInput {
  title: string;      // 3文字以上（サニタイズされる）
  content: string;    // HTMLコンテンツ（サニタイズされる）
  status?: 'draft' | 'published';  // デフォルトは'draft'
  categoryId?: number | null;     // カテゴリーID（任意）
}

/**
 * PostUpdateSerializer - 記事更新用
 * PATCH /v1/posts/{slug}/ のリクエストボディ
 */
export interface PostUpdateInput {
  title?: string;     // 3文字以上（サニタイズされる）
  content?: string;   // HTMLコンテンツ（サニタイズされる）
  status?: 'draft' | 'published';
  categoryId?: number | null;
}

// ============================================
// クエリパラメータ型
// ============================================

/**
 * 投稿一覧のフィルター・検索パラメータ
 */
export interface PostQueryParams {
  page?: number;
  pageSize?: number;    // バックエンドではpage_sizeに変換
  search?: string;      // title, contentを検索
  status?: 'draft' | 'published';
  author?: string;      // ユーザーID
  category?: string;    // カテゴリーslug
  ordering?: string;    // -createdAt, -updatedAt, createdAt, updatedAt
}

// ============================================
// JSend レスポンスデータ型
// ============================================

/**
 * 記事一覧APIレスポンスのdata部分
 * GET /v1/posts/
 */
export interface PostListData {
  posts: PostListItem[];  // 複数形
  pagination: PaginatedResponse;
}

/**
 * 記事詳細APIレスポンスのdata部分
 * GET /v1/posts/{slug}/
 */
export interface PostDetailData {
  post: PostDetail;  // 単数形
}

/**
 * 記事作成APIレスポンスのdata部分
 * POST /v1/posts/
 */
export interface PostCreateData {
  post: PostDetail;  // 単数形（作成後の詳細を返す）
}

/**
 * 記事更新APIレスポンスのdata部分
 * PATCH /v1/posts/{slug}/
 */
export interface PostUpdateData {
  post: PostDetail;  // 単数形（更新後の詳細を返す）
}

/**
 * ユーザーの投稿一覧APIレスポンスのdata部分
 * GET /v1/users/me/posts/
 * 
 * 注意: PostListDataと同じ構造だが、エンドポイントが異なるため分離
 */
export interface UserPostsData {
  posts: PostListItem[];  // 複数形
  pagination: PaginatedResponse;
}

// ============================================
// エンドポイント定数
// ============================================

export const POST_ENDPOINTS = {
  LIST: '/v1/posts/',
  DETAIL: (slug: string) => `/v1/posts/${slug}/`,
  CREATE: '/v1/posts/',
  UPDATE: (slug: string) => `/v1/posts/${slug}/`,
  DELETE: (slug: string) => `/v1/posts/${slug}/`,
} as const;