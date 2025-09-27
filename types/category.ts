/**
 * カテゴリ関連の型定義
 * Django blog/アプリのCategoryモデルと一致
 * 
 * 注意: バックエンドはsnake_case、フロントエンドはcamelCaseに自動変換される
 */

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
    post_count: number;
  }
  
  /**
   * CategoryWithCount - 投稿数を含むカテゴリ
   * annotateで追加されるpostCountを含む
   */
  export interface CategoryWithCount extends Category {
    postCount?: number;  // 公開済み投稿数（annotateで追加）
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