/**
 * 共通のAPI型定義
 * JSend形式のレスポンスやページネーションなど
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
  code?: string;  // UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR など
}

export type JSendResponse<T> = JSendSuccess<T> | JSendFail | JSendError;

// ============================================
// ページネーション型定義
// ============================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================
// Server Actions用の共通型
// ============================================

/**
 * Server Actionsの戻り値型
 */
export interface ActionSuccess<T> {
  status: 'success';
  message?: string;
  data: T;
}

export interface ActionError {
  status: 'error';
  message: string;
  errors?: Record<string, string | string[]>;
  code?: string;  
}

export type ActionResult<T> = ActionSuccess<T> | ActionError;

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

export function isActionSuccess<T>(
  result: ActionResult<T>
): result is ActionSuccess<T> {
  return result.status === 'success';
}

export function isActionError<T>(
  result: ActionResult<T>
): result is ActionError {
  return result.status === 'error';
}

// ============================================
// HTTPステータスコードとエラーコード定数
// ============================================

/**
 * バックエンドのResponseFormatterで使用されるエラーコード
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

/**
 * HTTPステータスコード
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;