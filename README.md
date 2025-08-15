# Next.js Blog Frontend

Django Blog APIのフロントエンドアプリケーション

## 🚀 デモサイト

**Live Demo**: https://blog-frontend-ten-xi.vercel.app  
**Backend API**: https://django-blog-ox35.onrender.com

## 📋 技術スタック

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Deploy**: Vercel

## ✨ 実装機能

- JWT認証（HttpOnly Cookie）
- 記事のCRUD操作
- 記事一覧・詳細のSSR対応
- レスポンシブデザイン
- リアルタイム状態管理

## 🔧 セットアップ

```bash
# Install dependencies
npm install

# Environment variables
cp .env.example .env.local

# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

# Run development server
npm run dev
```

## 📝 今後の改善予定

- [ ] 認証ページのSSR化
- [ ] ダッシュボードの部分的SSR化
- [ ] Markdownエディタ
- [ ] 検索機能
- [ ] ページネーション

## 👤 作者

keito-code