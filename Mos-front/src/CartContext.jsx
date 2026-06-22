import { useEffect, useState } from 'react'
import { orderHistoryRepository } from './services/orderHistoryRepository'
import { orderApi } from './services/api'
import { isStayExpired } from './utils/stayTimer'
import { CartContext } from './contexts/CartContext'

let cartIdCounter = 0

const generateCartId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  cartIdCounter += 1
  return `cart-${cartIdCounter}`
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [orderHistory, setOrderHistory] = useState([])
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false)

  useEffect(() => {
    let active = true
    orderHistoryRepository
      .load()
      .then((history) => { if (active) { setOrderHistory(history); setHasLoadedHistory(true) } })
      .catch(() => { if (active) { setOrderHistory([]); setHasLoadedHistory(true) } })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!hasLoadedHistory) return
    orderHistoryRepository.save(orderHistory).catch(() => {
      console.warn('Failed to save order history.')
    })
  }, [orderHistory, hasLoadedHistory])

  const addToCart = (item) => {
    if (isStayExpired()) return
    setCartItems((prev) => [...prev, { ...item, cartId: generateCartId() }])
  }

  const removeFromCart = (cartId) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId))
  }

  const resetCart = () => setCartItems([])

  const resetOrderHistory = () => setOrderHistory([])

  const confirmOrder = async () => {
    if (isStayExpired()) return false
    if (cartItems.length === 0) return false

    const localOrder = {
      id: Date.now(),
      items: cartItems,
      createdAt: new Date().toISOString()
    }

    setOrderHistory((prev) => [localOrder, ...prev])
    setCartItems([])

    // バックエンドへ送信（失敗してもローカル記録は保持）
    try {
      const seatId = sessionStorage.getItem('seatId') || '1'
      const courseType = sessionStorage.getItem('selectedCourse') || 'normal'
      const orderRequest = {
        seatId: Number(seatId),
        courseType,
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          itemName: item.name,
          unitPrice: item.price,
          quantity: 1
        }))
      }
      await orderApi.createOrder(orderRequest)
    } catch (e) {
      console.warn('[CartContext] API order failed, order saved locally only.', e)
    }

    return true
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount: cartItems.length,
        addToCart,
        removeFromCart,
        resetCart,
        resetOrderHistory,
        orderHistory,
        confirmOrder
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
