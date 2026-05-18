import { createContext, useState } from 'react'

export const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])

  const addToCart = (item) => {
    setCartItems(prev => [...prev, { ...item, cartId: Date.now() }])
  }

  const removeFromCart = (cartId) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId))
  }

  const resetCart = () => {
    setCartItems([])
  }

  return (
    <CartContext.Provider value={{ cartItems, cartCount: cartItems.length, addToCart, removeFromCart, resetCart }}>
      {children}
    </CartContext.Provider>
  )
}
