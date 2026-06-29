/**
 * Home.jsx — ホーム画面（アプリの最初の画面）
 *
 * アクセス URL: /
 *
 * 表示内容:
 *   - 居酒屋みどり亭のロゴ・店名
 *   - 「ご注文はこちら」→ /course（コース選択）へ遷移
 *   - 「スタッフ用」→ /staff（スタッフ画面）へ遷移
 *
 * このコンポーネントに状態（useState）は不要。
 * 表示するだけの「静的なページ」なので、シンプルな関数コンポーネントで記述できる。
 */

// Link: <a> タグの代わりに React Router が提供するナビゲーション用コンポーネント
//       クリックするとページ全体をリロードせずに画面を切り替える（SPA の動作）
import { Link } from 'react-router-dom'
import '../App.css' // スタイルシートを適用

export default function Home() {
  return (
    <div className="home-root">
      <div className="home-content">

        {/* 店舗ロゴ・店名エリア */}
        <div className="home-logo">
          <p className="home-logo-en">IZAKAYA MIDORI-TEI</p>
          <h1 className="home-logo-ja">居酒屋みどり亭</h1>
        </div>

        {/* 区切り線（デザイン用のボーダーライン） */}
        <div className="home-divider" />

        {/* 歓迎メッセージ */}
        <div className="home-welcome">
          <p className="home-welcome-main">いらっしゃいませ</p>
          <p className="home-welcome-sub">ご利用方法をお選びください</p>
        </div>

        {/* ナビゲーションボタン群 */}
        <div className="home-actions">
          {/*
            to="/course": クリックすると /course（コース選択ページ）へ移動する
            お客様はここからコース選択 → メニュー → 注文という流れで進む
          */}
          <Link to="/course" className="home-btn home-btn-primary">
            ご注文はこちら
          </Link>

          {/*
            to="/staff": スタッフ用ページへ移動する
            お客様には関係のない管理画面への入口
          */}
          <Link to="/staff" className="home-btn home-btn-ghost">
            スタッフ用
          </Link>
        </div>
      </div>
    </div>
  )
}
