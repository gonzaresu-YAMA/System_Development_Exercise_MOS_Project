import { useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import menuItems from '../data/menuItems'
import { CartContext } from '../CartContext'
import useStayRemaining from '../hooks/useStayRemaining'
import '../App.css'
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

  if (!item) {
    return (
      <div className="page-content">
        <p>商品が見つかりません。</p>
      </div>
    )
  }

  const inc = () => setQty((q) => q + 1)
  const dec = () => setQty((q) => (q > 1 ? q - 1 : 1))

  const handleAdd = () => {
    if (isExpired) return
    for (let i = 0; i < qty; i++) {
      addToCart({ id: item.id, name: item.name, price: shouldHidePrice ? 0 : item.price, image: item.image })
    }
    navigate('/menu')
  }

  return (
    <div className="product-detail-screen">
      <header className="product-detail-header">
        <button type="button" className="product-detail-back" onClick={() => navigate(-1)}>
          ← 戻る
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
              {shouldHidePrice
                ? '飲み放題'
                : item.price === 0
                ? '無料'
                : `¥${item.price}`}
            </p>
          </div>

          {isDrinkItem && isDrinkExcluded && (
            <p className="drink-excluded-label">飲み放題対象外</p>
          )}

          <div className="qty-controls">
            <button type="button" onClick={dec} className="qty-btn">−</button>
            <div className="qty-display">{qty}</div>
            <button type="button" onClick={inc} className="qty-btn">＋</button>
          </div>

          <button
            type="button"
            className="add-to-cart"
            onClick={handleAdd}
            disabled={isExpired || item.soldOut}
          >
            {item.soldOut ? '売り切れ' : `カートに追加（${qty}点）`}
          </button>
        </div>
      </main>
    </div>
  )
}
