
// 著者の型
export interface Author {
    id: number;
    username: string;
  }
  
  // 記事一覧用の型（軽量版）
  export interface PostListItem {
    id: number;
    title: string;
    slug: string;
    author: string;  // 一覧では文字列のみ
    status: 'draft' | 'published';
    publish: string;
    created: string;
  }
  
  // 記事詳細用の型（完全版）
  export interface PostDetail {
    id: number;
    title: string;
    slug: string;
    author: Author;  // 詳細ではオブジェクト
    content: string;
    status: 'draft' | 'published';
    publish: string;
    created: string;
    updated: string;
    comments: any[];  // 後でComment型を定義
  }
  
  // ページネーション付きのレスポンス
  export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
  }