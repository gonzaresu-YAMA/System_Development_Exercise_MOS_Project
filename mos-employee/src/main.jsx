// ── アプリのエントリポイント ────────────────────────────────
// このファイルが最初に実行され、React アプリ全体が起動します。
// HTML の <div id="root"> 要素を探して、そこにアプリを描画します。

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './app/routes/AppRoutes'
// グローバルスタイルを読み込む（リセット・デザイントークン・汎用クラス）
import './styles/reset.css'
import './styles/tokens.css'
import './styles/app.css'

// createRoot: React 18 の新しいレンダリング方式（index.html の <div id="root"> に描画）
// BrowserRouter: URL の変化を監視してページ切り替えを実現するルーターを設置
createRoot(document.getElementById('root')).render(
  // StrictMode: 開発中のみ有効。副作用の二重実行などで潜在的なバグを検出する
  <StrictMode>
    {/* BrowserRouter はアプリ全体を包む。これにより <Route> や useNavigate が使えるようになる */}
    <BrowserRouter>
      {/* 全ルート定義は AppRoutes にまとめられている */}
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>
)
