import { createContext, useState } from 'react'

export const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [orderHistory, setOrderHistory] = useState([])

  const addToCart = (item) => {
    setCartItems(prev => [...prev, { ...item, cartId: Date.now() }])
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
