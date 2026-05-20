import { useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import menuItems from '../data/menuItems'
import { CartContext } from '../CartContext'
import '../menu.css'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useContext(CartContext)
  const item = menuItems.find((m) => String(m.id) === String(id))

  const [qty, setQty] = useState(1)
  if (!item) return <div>商品が見つかりません。</div>

  const inc = () => setQty((q) => q + 1)
  const dec = () => setQty((q) => (q > 1 ? q - 1 : 1))

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addToCart({ id: item.id, name: item.name, price: item.price })
    }
    navigate('/menu')
  }

  return (
    <div className="product-detail-screen">
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
            <p className="product-detail-price">¥{item.price}</p>
          </div>

          <div className="qty-controls">
            <button onClick={dec} className="qty-btn">-</button>
            <div className="qty-display">{qty}</div>
            <button onClick={inc} className="qty-btn">+</button>
          </div>

          <button className="add-to-cart big" onClick={handleAdd}>
            カートに入れる
          </button>
        </div>
      </main>
    </div>
  )
}
