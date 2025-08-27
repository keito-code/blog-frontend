import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import sanitizeHtml from 'sanitize-html';

// markedの設定
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // 改行を<br>に変換
});

interface ServerMarkdownRendererProps {
  content: string;
  sanitize?: boolean;
}

// sanitize-htmlの設定（軽量で高速）
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's', 'del',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre', 'span',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr'
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    code: ['class'], // highlight.js用
    span: ['class'], // highlight.js用
    pre: ['class'],
    // 全タグ共通
    '*': ['class']
  },
  allowedClasses: {
    code: ['hljs', 'language-*', 'hljs-*'],
    span: ['hljs-*'],
    pre: ['hljs']
  },
  // URLスキームの制限
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  // target="_blank"にrel="noopener noreferrer"を自動追加
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        return {
          tagName,
          attribs: {
            ...attribs,
            rel: 'noopener noreferrer'
          }
        };
      }
      return { tagName, attribs };
    }
  }
};

export default async function ServerMarkdownRenderer({ 
  content, 
  sanitize = true  // デフォルトで安全側
}: ServerMarkdownRendererProps) {
  // Markdownをパース
  let html = (await marked.parse(content)) as string;
  
  // デフォルトでサニタイズ（ユーザー投稿は必須）
  if (sanitize) {
    html = sanitizeHtml(html, sanitizeOptions);
  }
  
  return (
    <article 
      className="
        prose prose-lg max-w-none
        prose-headings:scroll-mt-20
        prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
        prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-[#0d1117] prose-pre:text-gray-100
        prose-img:rounded-lg prose-img:shadow-md prose-img:mx-auto
        prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}