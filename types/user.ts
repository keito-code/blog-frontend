/**
 * ユーザー関連の型定義
 * Django accounts/アプリのSerializerと完全に一致
 */

// ============================================
// ユーザーモデル（Django Serializerと一致）
// ============================================

/**
 * PublicUserSerializer
 * ログイン・登録のレスポンス用
 */
export interface PublicUser {
    id: number;
    date_joined: string;
  }
  
  /**
   * PrivateUserSerializer
   * 認証済みユーザーの情報取得用
   */
  export interface PrivateUser {
    id: number;
    username: string;
    email: string;
    dateJoined: string;
  }
  
  /**
   * AdminUserSerializer
   * 管理者権限を持つユーザー用
   */
  export interface AdminUser extends PrivateUser {
    isActive: boolean;
    isStaff: boolean;
  }
  
  /**
   * 一般的なユーザー型
   * Server ActionsやComponentsで使用
   */
  export type User = PrivateUser;
  
  // ============================================
  // リクエスト型
  // ============================================
  
  /**
   * UpdateUserSerializer
   * 一般ユーザーはemailのみ変更可能
   */
  export interface UpdateUserRequest {
    email: string;
  }
  
  /**
   * AdminUpdateUserSerializer
   * 管理者は追加フィールドの変更可能
   */
  export interface AdminUpdateUserRequest {
    username?: string;
    email?: string;
    isActive?: boolean;
    isStaff?: boolean;
  }
  
  // ============================================
  // レスポンス型
  // ============================================
  
  export interface UserResponse {
    user: PrivateUser | AdminUser;
  }
  
  // ============================================
  // 型ガード
  // ============================================
  
  export function isAdminUser(user: PrivateUser | AdminUser): user is AdminUser {
    return 'is_staff' in user && user.is_staff === true;
  }
  
  // ============================================
  // エンドポイント定数
  // ============================================
  
  export const USER_ENDPOINTS = {
    ME: '/v1/users/me/',
    MY_POSTS: '/v1/users/me/posts/',
  } as const;