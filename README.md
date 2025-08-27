# Next.js Blog Frontend

Django Blog APIのフロントエンドアプリケーション

## 🚀 デモサイト

**Live Demo**: https://blog-frontend-ten-xi.vercel.app  
**Backend API**: https://django-blog-ox35.onrender.com

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
```
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
DJANGO_API_URL=http://localhost:8000
```

## 📝 今後の拡張・改善予定

- [ ] ページネーション
- [ ] Markdownプレビュー機能
- [ ] コメント機能
- [ ] タグ・カテゴリー機能
- [ ] 認証機能のServer Actions化(Route Handler → Server Actions移行)
- [ ] URLメッセージのモダン化(日本語 → メッセージコード化)
- [ ] DAL層の実装


## 👤 作者

keito-code