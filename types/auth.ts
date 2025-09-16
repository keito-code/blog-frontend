/**
 * 認証関連の型定義
 * Django accounts/アプリのSerializerと完全に一致
 */

// ============================================
// JSend形式のレスポンス型定義
// ============================================

export interface JSendSuccess<T> {
    status: 'success';
    data: T;
  }
  
  export interface JSendFail {
    status: 'fail';
    data: Record<string, string | string[]>;  // バリデーションエラー
  }
  
  export interface JSendError {
    status: 'error';
    message: string;
    code?: string;
  }
  
  export type JSendResponse<T> = JSendSuccess<T> | JSendFail | JSendError;
  
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
    date_joined: string;
  }
  
  /**
   * AdminUserSerializer
   * 管理者権限を持つユーザー用
   */
  export interface AdminUser extends PrivateUser {
    is_active: boolean;
    is_staff: boolean;
  }
  
  // ============================================
  // リクエスト型（Django Serializerと一致）
  // ============================================
  
  /**
   * LoginSerializer
   * email + password認証
   */
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  /**
   * RegisterSerializer
   */
  export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
  }
  
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
    is_active?: boolean;
    is_staff?: boolean;
  }
  
  // ============================================
  // APIレスポンス型
  // ============================================
  
  export interface LoginResponse {
    user: PublicUser;
  }
  
  export interface RegisterResponse {
    user: PublicUser;
  }
  
  export interface UserResponse {
    user: PrivateUser | AdminUser;
  }
  
  export interface CSRFTokenResponse {
    csrf_token: string;
  }
  
  export interface VerifyResponse {
    valid: boolean;
  }
  
  // ============================================
  // Server Actions用の型定義
  // ============================================
  
  /**
   * フォーム状態（useFormStateで使用）
   */
  export interface AuthFormState {
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
    user?: PublicUser | PrivateUser;
  }
  
  /**
   * エラーレスポンス
   */
  export interface ValidationErrors {
    [field: string]: string[];
  }
  
  // ============================================
  // 型ガード
  // ============================================
  
  export function isJSendSuccess<T>(response: JSendResponse<T>): response is JSendSuccess<T> {
    return response.status === 'success';
  }
  
  export function isJSendFail(response: JSendResponse<unknown>): response is JSendFail {
    return response.status === 'fail';
  }
  
  export function isJSendError(response: JSendResponse<unknown>): response is JSendError {
    return response.status === 'error';
  }
  
  export function isAdminUser(user: PrivateUser | AdminUser): user is AdminUser {
    return 'is_staff' in user && user.is_staff === true;
  }
  
  // ============================================
  // 定数
  // ============================================
  
  export const AUTH_ENDPOINTS = {
    CSRF: '/auth/csrf/',
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',
    REGISTER: '/auth/register/',
    REFRESH: '/auth/refresh/',
    USER: '/auth/user/',
    VERIFY: '/auth/verify/',
  } as const;