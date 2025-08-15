// 著者の型
export interface Author {
  id: number;
  username: string;
}

// コメントの型
export interface Comment {
  id: number;
  name: string;
  email: string;
  body: string;
  created: string;  // ISO 8601形式の日時文字列
}

// 記事一覧用の型（軽量版）
export interface PostListItem {
  id: number;
  title: string;
  slug: string;
  author: string;  // 一覧では username の文字列のみ
  status: 'draft' | 'published';
  publish: string;  // ISO 8601形式の日時文字列
  created: string;  // ISO 8601形式の日時文字列
}

// 記事詳細用の型（完全版）
export interface PostDetail {
  id: number;
  title: string;
  slug: string;
  author: Author;  // 詳細ではオブジェクト
  content: string;
  status: 'draft' | 'published';
  publish: string;  // ISO 8601形式の日時文字列
  created: string;  // ISO 8601形式の日時文字列
  updated: string;  // ISO 8601形式の日時文字列
  comments: Comment[];
}

// ページネーション付きのレスポンス
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}