import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../CartContext'
import '../menu.css'
import freeImage from '../assets/無料備品.jpg'
import yakitoriImage from '../assets/焼き鳥.jpeg'
import speedImage from '../assets/スピード.jpg'
import riceImage from '../assets/ご飯もの.jpg'

const categories = [
  { id: 'free', label: '無料備品', image: freeImage },
  { id: 'yakitori', label: '焼き鳥', image: yakitoriImage },
  { id: 'rice', label: 'ごはんもの', image: riceImage },
  { id: 'speed', label: 'スピード', image: speedImage },
  { id: 'drink', label: 'ドリンク', image: '' },
  { id: 'dessert', label: 'デザート', image: '' }
]

export default function CategoryMenu() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const { resetOrderHistory } = useContext(CartContext)

  const handleCheckout = () => {
    setIsConfirmOpen(true)
  }

  const handleConfirm = () => {
    setIsConfirmOpen(false)
    resetOrderHistory()
    navigate('/checkout')
  }

  return (
    <MenuLayout activeTab="categories" showCheckout onCheckoutClick={handleCheckout}>
      <div className="category-grid">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/menu/c/${category.id}`}
            className={`category-card category-card-${category.id}`}
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