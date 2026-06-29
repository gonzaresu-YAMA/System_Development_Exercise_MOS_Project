/**
 * App.jsx — お客様用アプリのルーティング定義
 *
 * このファイルは「どのURLにアクセスしたらどのページコンポーネントを表示するか」を定義します。
 * また、カート情報をすべてのページで共有するための CartProvider でページ全体を包んでいます。
 *
 * ページ遷移の全体フロー:
 *   / (ホーム画面)
 *     └→ /course (コース選択)
 *          └→ /menu (メニューブック = カテゴリ一覧)
 *               ├→ /menu/c/:category  (カテゴリ別商品一覧)
 *               │    └→ /menu/item/:id (商品詳細)
 *               ├→ /order-confirm  (注文保留確認)
 *               │    └→ /order-send (注文送信)
 *               ├→ /history        (注文履歴)
 *               ├→ /call-staff     (店員呼び出し)
 *               │    └→ /call-staff-calling (呼び出し中画面)
 *               └→ /checkout       (お会計)
 *   /staff → スタッフ用ページ
 */

// Routes: 複数の Route をまとめるコンテナ
// Route: URLとコンポーネントの対応を定義する
// Navigate: 指定のURLへ即座にリダイレクトする（廃止済みURLの転送などに使う）
import { Routes, Route, Navigate } from 'react-router-dom'

// CartProvider: カートの状態（商品リスト・注文履歴など）を全ページで共有する仕組み
// これで包まれた子コンポーネントはすべて useContext(CartContext) でカート操作を使える
import { CartProvider } from './CartContext'
import './App.css'

// 各ページのコンポーネントを個別にインポート
// ※ 遅延読み込み（React.lazy）は使っていないため、アプリ起動時にすべて読み込まれる
import Home from './pages/Home'
import CourseSelectPage from './pages/CourseSelectPage'
import MenuPage from './pages/MenuPage'
import CategoryMenu from './pages/CategoryMenu'
import HistoryPage from './pages/HistoryPage'
import OrderConfirmPage from './pages/OrderConfirmPage'
import OrderSendPage from './pages/OrderSendPage'
import CallStaffPage from './pages/CallStaffPage'
import CallingStaffPage from './pages/CallingStaffPage'
import StaffPage from './pages/StaffPage'
import CheckoutPage from './pages/CheckoutPage'
import ProductDetail from './pages/ProductDetail'

function App() {
  return (
    // CartProvider で全ページを包む
    // → これにより、どのページからでもカートの状態を読み書きできる
    <CartProvider>
      <Routes>

        {/* ── ホーム画面 ── */}
        <Route path="/" element={<Home />} />

        {/* /home にアクセスしても / (ホーム) に自動リダイレクトする */}
        {/* replace: ブラウザの履歴に /home を残さない（戻るボタンで /home に戻れないようにする） */}
        <Route path="/home" element={<Navigate to="/" replace />} />

        {/* ── コース選択（通常 or 飲み放題）── */}
        <Route path="/course" element={<CourseSelectPage />} />

        {/* 旧パス /about は廃止済み → /menu にリダイレクト */}
        <Route path="/about" element={<Navigate to="/menu" replace />} />

        {/* ── お会計画面 ── */}
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* ── メニュー系 ── */}

        {/* メインのメニューブック（カテゴリ一覧。ページをめくる形式） */}
        <Route path="/menu" element={<CategoryMenu />} />

        {/* 旧パス /menu/categories は廃止済み → /menu にリダイレクト */}
        <Route path="/menu/categories" element={<Navigate to="/menu" replace />} />

        {/*
          商品詳細ページ
          :id は「動的パラメーター」と呼ばれる。URLの一部を変数として扱える。
          例: /menu/item/9 → id=9 の商品詳細を表示
              /menu/item/25 → id=25 の商品詳細を表示
        */}
        <Route path="/menu/item/:id" element={<ProductDetail />} />

        {/*
          カテゴリ別商品一覧ページ
          :category も動的パラメーター
          例: /menu/c/yakitori → 焼き鳥カテゴリの一覧
              /menu/c/drink    → ドリンクカテゴリの一覧
        */}
        <Route path="/menu/c/:category" element={<MenuPage />} />

        {/* ── 注文フロー ── */}
        <Route path="/history" element={<HistoryPage />} />        {/* 注文履歴 */}
        <Route path="/order-confirm" element={<OrderConfirmPage />} /> {/* 注文保留の確認 */}
        <Route path="/order-send" element={<OrderSendPage />} />   {/* 注文の最終確認・送信 */}

        {/* ── 店員呼び出しフロー ── */}
        <Route path="/call-staff" element={<CallStaffPage />} />           {/* 呼び出しボタン */}
        <Route path="/call-staff-calling" element={<CallingStaffPage />} />{/* 呼び出し中表示 */}

        {/* ── スタッフ用 ── */}
        <Route path="/staff" element={<StaffPage />} />
      </Routes>
    </CartProvider>
  )
}

export default App
