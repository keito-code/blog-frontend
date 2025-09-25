/**
 * 認証関連の型定義
 * Django auth/アプリのSerializerと完全に一致
 */

import { PublicUser } from './user';

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
  passwordConfirmation: string;
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
  csrfToken: string;
}

export interface VerifyResponse {
  valid: boolean;
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