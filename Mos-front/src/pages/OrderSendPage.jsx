import { useContext, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../CartContext'
import '../menu.css'

export default function OrderSendPage() {
  const { cartItems, confirmOrder } = useContext(CartContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/menu')
    }
  }, [cartItems, navigate])

  const handleConfirm = () => {
    const didConfirm = confirmOrder()
    navigate(didConfirm ? '/history' : '/menu')
  }

  return (
    <MenuLayout activeTab="free">
      <div className="modal-overlay">
        <div className="modal-card">
          <p>注文を確定しますか？</p>
          <div className="modal-actions">
            <button
              type="button"
              className="modal-button"
              onClick={handleConfirm}
              disabled={cartItems.length === 0}
            >
              はい
            </button>
            <Link to="/menu" className="modal-button is-dark">いいえ</Link>
          </div>
        </div>
      </div>
    </MenuLayout>
  )
}
