import { useContext, useEffect } from 'react'
import { CartContext } from '../contexts/CartContext'
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
    <div className="checkout-root">
      <div className="checkout-card">
        <span className="checkout-icon">🍶</span>
        <h2 className="checkout-title">お会計</h2>
        <p className="checkout-msg">
          本日はご来店いただきありがとうございました。
          <br />
          またのお越しをお待ちしております。
        </p>
      </div>
    </div>
  )
}
