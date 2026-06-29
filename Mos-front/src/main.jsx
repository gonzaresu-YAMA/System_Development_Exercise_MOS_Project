/**
 * main.jsx — アプリのエントリーポイント（起動の入口）
 *
 * このファイルはブラウザが最初に実行する JavaScript ファイルです。
 * index.html の <div id="root"> に React アプリ全体を描画します。
 *
 * 画面遷移の全体像:
 *   /employee → Employee コンポーネント（従業員用画面）
 *   /* (それ以外すべて) → App コンポーネント（お客様用画面）
 *       └→ App 内でさらにページごとのルーティングが定義されている
 */

// StrictMode: 開発中に潜在的な問題（副作用の二重実行など）を検出するための
//             ラッパーコンポーネント。本番ビルドでは自動的に無効になる。
import { StrictMode } from 'react'

// createRoot: React 18 で導入された新しい描画 API
// 旧来の ReactDOM.render() の代わりに使う
import { createRoot } from 'react-dom/client'

// BrowserRouter: URL の変化を React Router が検知できるようにするラッパー
// Routes: 複数の Route をまとめるコンテナ
// Route: 「このURLならこのコンポーネントを表示する」という対応を定義する
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import App from './App'         // お客様用画面のルートコンポーネント
import Employee from './Employee' // 従業員用画面のルートコンポーネント
import './index.css'            // アプリ全体に適用される基本スタイル

// document.getElementById('root') → index.html の <div id="root"> 要素を取得
// createRoot(...).render(...) → その要素の中に React アプリを描画する
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/*
      BrowserRouter: これで囲むことで子コンポーネントの中で
      useNavigate や Link などのルーティング機能が使えるようになる
    */}
    <BrowserRouter>
      <Routes>
        {/*
          Route: path と element を対応付ける
          path="/employee" は従業員専用ページへの直接アクセス用
          path="/*" は "/employee" 以外のすべてのパスを App に渡す
          ※ より具体的なパス (/employee) が先にマッチするため順番は問わないが、
            明示的に /employee を先に書いている
        */}
        <Route path="/employee" element={<Employee />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
