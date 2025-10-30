# Next.js Blog Frontend

Django Blog APIのフロントエンドアプリケーション

## 🚀 デモサイト

**Live Demo**: https://post-log.com (https://www.post-log.com)  
**Backend API**: https://api.post-log.com

## 📋 技術スタック

- **Framework**: Next.js 15.4.6 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Deploy**: Vercel

## ✨ 実装機能

- 記事のCRUD操作
- JWT認証（HttpOnly Cookie）
- 検索機能
- 公開/非公開管理
- Markdownレンダリング
- カテゴリー機能
- ページネーション

## 🔧 セットアップ

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local

# 開発サーバー起動
npm run dev
```

## 環境変数

### 開発環境
```
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
DJANGO_API_URL=http://localhost:8000
```


## 👤 作者

keito-code