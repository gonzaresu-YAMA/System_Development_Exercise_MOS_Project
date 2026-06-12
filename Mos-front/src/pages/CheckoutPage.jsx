import { useContext, useEffect } from 'react'
import { CartContext } from '../CartContext'
import '../App.css'

export default function CheckoutPage() {
  const { cartItems, resetCart, resetOrderHistory } = useContext(CartContext)

  useEffect(() => {
    if (cartItems.length > 0) {
      resetCart()
      resetOrderHistory()
    }
  }, [cartItems, resetCart, resetOrderHistory])

  return (
    <div className="page-content">
      <h2>お会計</h2>
      <p>お会計画面です。ご来店ありがとうございました。</p>
    </div>
  )
}
