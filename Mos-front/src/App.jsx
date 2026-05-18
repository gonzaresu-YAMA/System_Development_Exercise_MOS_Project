import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import './App.css'
import CustomerPage from './Customer'
import MenuPage, {
  HistoryPage,
  OrderConfirmPage,
  OrderSendPage,
  CallStaffPage
} from './menu'

function Home() {
  return (
    <>
      <div className="page-title">
        <h1>居酒屋みどり亭</h1>
      </div>

      <div className="welcome-text">
        <h1>いらっしゃいませ</h1>
        <h2>ボタンをお選びください</h2>
      </div>

      <div className="button-row">
        <Link to="/customer" className="nav-button customer-button">
          お客様用画面へ移行
        </Link>
      </div>

      <Link to="/staff" className="nav-button staff-button">
        スタッフ用画面
      </Link>
    </>
  )
}

function StaffPage() {
  return (
    <div className="page-content">
      <h2>スタッフ用画面</h2>
      <p>スタッフ専用の管理機能へアクセスします。</p>

      <Link to="/" className="nav-button back-button">
        トップへ戻る
      </Link>
    </div>
  )
}

function CheckoutPage() {
  return (
    <div className="page-content">
      <h2>お会計</h2>
      <p>お会計画面です。確認後はカスタマー画面へ戻ります。</p>

      <div className="button-row">
        <Link to="/customer" className="nav-button back-button">
          カスタマー画面へ戻る
        </Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-main">
        <main className="home-section">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<Navigate to="/customer" replace />} />
            <Route path="/customer" element={<CustomerPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/order-confirm" element={<OrderConfirmPage />} />
            <Route path="/order-send" element={<OrderSendPage />} />
            <Route path="/call-staff" element={<CallStaffPage />} />
            <Route path="/staff" element={<StaffPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App