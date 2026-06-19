import { Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './CartContext'
import './App.css'
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
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/course" element={<CourseSelectPage />} />
        <Route path="/about" element={<Navigate to="/menu" replace />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/menu" element={<CategoryMenu />} />
        <Route path="/menu/categories" element={<Navigate to="/menu" replace />} />
        <Route path="/menu/item/:id" element={<ProductDetail />} />
        <Route path="/menu/c/:category" element={<MenuPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/order-confirm" element={<OrderConfirmPage />} />
        <Route path="/order-send" element={<OrderSendPage />} />
        <Route path="/call-staff" element={<CallStaffPage />} />
        <Route path="/call-staff-calling" element={<CallingStaffPage />} />
        <Route path="/staff" element={<StaffPage />} />
      </Routes>
    </CartProvider>
  )
}

export default App
