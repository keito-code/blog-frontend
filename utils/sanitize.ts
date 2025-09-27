import DOMPurify from 'isomorphic-dompurify';

/**
 * HTMLタグを完全に除去（プレーンテキスト化）
 * 検索結果のタイトルや著者名などに使用
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // HTMLタグを除去
  const cleaned = DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true 
  });
  
  return cleaned;
}

/**
 * 基本的なHTMLタグのみ許可（表示用）
 * コンテンツの抜粋表示などに使用
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

/**
 * 検索クエリのサニタイズ（特殊文字をエスケープ）
 * ユーザー入力の検索キーワード表示用
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  // HTMLエンティティをエスケープ
  return query
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Markdownコンテンツ用のサニタイズ
 * 危険なスクリプトを除去しつつMarkdown記法は保持
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  // スクリプトタグとイベントハンドラを除去
  const cleaned = markdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return cleaned;
}