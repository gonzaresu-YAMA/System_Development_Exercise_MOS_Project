import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import '../menu.css'

const categories = [
  { id: 'free', label: '無料備品', image: '/oshibori.png' },
  { id: 'yakitori', label: '焼き鳥', image: '/yakitori.jpg' },
  { id: 'rice', label: 'ごはんもの', image: '' },
  { id: 'speed', label: 'スピード', image: '' },
  { id: 'drink', label: 'ドリンク', image: '/beer.jpg' },
  { id: 'dessert', label: 'デザート', image: '' }
]

export default function CategoryMenu() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const navigate = useNavigate()

  const handleCheckout = () => {
    setIsConfirmOpen(true)
  }

  const handleConfirm = () => {
    setIsConfirmOpen(false)
    navigate('/checkout')
  }

  return (
    <MenuLayout activeTab="free" showCheckout onCheckoutClick={handleCheckout}>
      <div className="category-grid">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/menu/${category.id}`}
            className="category-card"
          >
            <div className="category-image-area">
              {category.image ? (
                <img src={category.image} alt={category.label} className="category-image" />
              ) : (
                <div className="category-image-placeholder" />
              )}
            </div>
            <div className="category-label">{category.label}</div>
          </Link>
        ))}
      </div>

      {isConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p>
              お支払いを確定しますか?
              <br />
              確定後は追加注文することができません
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-button" onClick={handleConfirm}>
                はい
              </button>
              <button
                type="button"
                className="modal-button is-dark"
                onClick={() => setIsConfirmOpen(false)}
              >
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}
    </MenuLayout>
  )
}