import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../CartContext'
import menuItems from '../data/menuItems'
import '../menu.css'

export default function MenuPage() {
  const { addToCart } = useContext(CartContext)
  const navigate = useNavigate()

  const handleShowDetail = (item) => {
    navigate(`/menu/item/${item.id}`)
  }

  return (
    <MenuLayout activeTab="free">
      <div className="menu-grid">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-card ${item.soldOut ? 'is-sold-out' : ''}`}
          >
            <div className="menu-image-area">
              {item.image ? (
                <img src={item.image} alt={item.name} className="menu-image" />
              ) : (
                <div className="menu-image-placeholder" />
              )}
              {item.soldOut && <div className="sold-out-label">売り切れ</div>}
            </div>

            <div className="menu-card-body">
              <p className="menu-item-name">{item.name}</p>
              <p className="menu-item-price">{item.price}￥</p>

              <button
                type="button"
                className="cart-button"
                disabled={item.soldOut}
                onClick={() => handleShowDetail(item)}
              >
                カートに入れる
              </button>
            </div>
          </div>
        ))}
      </div>
    </MenuLayout>
  )
}
