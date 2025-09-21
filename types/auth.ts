/**
 * 認証関連の型定義
 * Django auth/アプリのSerializerと完全に一致
 */

import { PublicUser, PrivateUser } from './user';
import { FormState } from './api';

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

// ============================================
// レスポンス型
// ============================================

export interface LoginResponse {
  user: PublicUser;
}

export interface RegisterResponse {
  user: PublicUser;
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
 * 認証フォーム状態（useFormStateで使用）
 */
export interface AuthFormState extends FormState {
  user?: PublicUser | PrivateUser;
}

// ============================================
// エンドポイント定数
// ============================================

export const AUTH_ENDPOINTS = {
  CSRF: '/v1/auth/csrf/',
  LOGIN: '/v1/auth/login/',
  LOGOUT: '/v1/auth/logout/',
  REGISTER: '/v1/auth/register/',
  REFRESH: '/v1/auth/refresh/',
  VERIFY: '/v1/auth/verify/',
} as const;