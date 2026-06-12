import { useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import menuItems from '../data/menuItems'
import { CartContext } from '../CartContext'
import useStayRemaining from '../hooks/useStayRemaining'
import '../menu.css'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useContext(CartContext)
  const item = menuItems.find((m) => String(m.id) === String(id))
  const selectedCourse = sessionStorage.getItem('selectedCourse') || ''
  const isDrinkPlan = selectedCourse.startsWith('drink')
  const isDrinkItem = item?.category === 'drink'
  const isDrinkExcluded = Boolean(item?.drinkPlanExcluded)
  const shouldHidePrice = isDrinkPlan && isDrinkItem && !isDrinkExcluded
  const { isExpired } = useStayRemaining()

  const [qty, setQty] = useState(1)
  if (!item) return <div>商品が見つかりません。</div>

  const inc = () => setQty((q) => q + 1)
  const dec = () => setQty((q) => (q > 1 ? q - 1 : 1))

  const handleAdd = () => {
    if (isExpired) return
    for (let i = 0; i < qty; i++) {
      const price = shouldHidePrice ? 0 : item.price
      addToCart({ id: item.id, name: item.name, price, image: item.image })
    }
    navigate('/menu')
  }

  return (
    <div className={`product-detail-screen product-detail-${item.category}`}>
      <header className="product-detail-header">
        <button
          type="button"
          className="product-detail-back"
          onClick={() => navigate(-1)}
        >
          &lt;&lt; 戻る
        </button>
      </header>

      <main className="product-detail-body">
        <div className="product-detail-image">
          {item.image ? (
            <img src={item.image} alt={item.name} className="product-image" />
          ) : (
            <div className="product-image-placeholder" />
          )}
        </div>

        <div className="product-detail-info">
          <div className="product-detail-row">
            <h2 className="product-detail-name">{item.name}</h2>
            <p className="product-detail-price">
              {shouldHidePrice ? '' : `¥${item.price}`}
            </p>
          </div>

          {isDrinkItem && isDrinkExcluded && (
            <p className="drink-excluded-label">飲み放題対象外</p>
          )}

          <div className="qty-controls">
            <button type="button" onClick={dec} className="qty-btn">-</button>
            <div className="qty-display">{qty}</div>
            <button type="button" onClick={inc} className="qty-btn">+</button>
          </div>

          <button
            type="button"
            className="add-to-cart big"
            onClick={handleAdd}
            disabled={isExpired}
          >
            カートに入れる
          </button>
        </div>
      </main>
    </div>
  )
}

