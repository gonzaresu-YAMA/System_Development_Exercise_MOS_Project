import { createContext, useEffect, useState } from 'react'
import { orderHistoryRepository } from './services/orderHistoryRepository'
import { isStayExpired } from './utils/stayTimer'

let cartIdCounter = 0

const generateCartId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  cartIdCounter += 1
  return `cart-${cartIdCounter}`
}

export const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [orderHistory, setOrderHistory] = useState([])
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false)

  useEffect(() => {
    let isActive = true

    orderHistoryRepository
      .load()
      .then((history) => {
        if (isActive) {
          setOrderHistory(history)
          setHasLoadedHistory(true)
        }
      })
      .catch(() => {
        if (isActive) {
          setOrderHistory([])
          setHasLoadedHistory(true)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedHistory) return
    orderHistoryRepository.save(orderHistory).catch(() => {
      console.warn('Failed to save order history to storage.')
    })
  }, [orderHistory, hasLoadedHistory])

  const addToCart = (item) => {
    if (isStayExpired()) return
    setCartItems(prev => [...prev, { ...item, cartId: generateCartId() }])
  }

  const removeFromCart = (cartId) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId))
  }

  const resetCart = () => {
    setCartItems([])
  }

  const resetOrderHistory = () => {
    setOrderHistory([])
  }

  const confirmOrder = () => {
    if (isStayExpired()) return false
    if (cartItems.length === 0) return false
    const order = {
      id: Date.now(),
      items: cartItems,
      createdAt: new Date().toISOString()
    }
    setOrderHistory(prev => [order, ...prev])
    setCartItems([])
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
