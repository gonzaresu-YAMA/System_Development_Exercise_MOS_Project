import { createContext, useEffect, useState } from 'react'

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
  const [orderHistory, setOrderHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('orderHistory')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    const didInit = sessionStorage.getItem('didInitOrderHistory')
    if (!didInit) {
      setOrderHistory([])
      localStorage.removeItem('orderHistory')
      sessionStorage.setItem('didInitOrderHistory', 'true')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory))
  }, [orderHistory])

  const addToCart = (item) => {
    setCartItems(prev => [...prev, { ...item, cartId: generateCartId() }])
  }

  const removeFromCart = (cartId) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId))
  }

  const resetCart = () => {
    setCartItems([])
  }

  const confirmOrder = () => {
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
        orderHistory,
        confirmOrder
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
