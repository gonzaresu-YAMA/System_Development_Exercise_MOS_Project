import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { CartProvider } from './CartContext'
import Home from './pages/Home'
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
    <BrowserRouter>
      <CartProvider>
        <div className="app-main">
          <main className="home-section">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<Navigate to="/menu/categories" replace />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/menu" element={<Navigate to="/menu/categories" replace />} />
              <Route path="/menu/categories" element={<CategoryMenu />} />
              <Route path="/menu/item/:id" element={<ProductDetail />} />
              <Route path="/menu/:category" element={<MenuPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/order-confirm" element={<OrderConfirmPage />} />
              <Route path="/order-send" element={<OrderSendPage />} />
              <Route path="/call-staff" element={<CallStaffPage />} />
              <Route path="/call-staff-calling" element={<CallingStaffPage />} />
              <Route path="/staff" element={<StaffPage />} />
            </Routes>
          </main>
        </div>
      </CartProvider>
    </BrowserRouter>
  )
}

export default App