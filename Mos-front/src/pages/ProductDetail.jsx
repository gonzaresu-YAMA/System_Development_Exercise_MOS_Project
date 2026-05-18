import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import menuItems from '../data/menuItems'
import { useContext } from 'react'
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
    <div className="page-content">
      <div className="page-card product-detail">
        <div className="product-image-area">
          {item.image ? (
            <img src={item.image} alt={item.name} className="product-image" />
          ) : (
            <div style={{height:240, background:'#fff'}} />
          )}
        </div>

        <div className="product-info">
          <h2>{item.name}</h2>
          <p className="price">¥{item.price}</p>

          <div className="qty-controls">
            <button onClick={dec} className="qty-btn">-</button>
            <div className="qty-display">{qty}</div>
            <button onClick={inc} className="qty-btn">+</button>
          </div>

          <button className="add-to-cart big" onClick={handleAdd}>
            カートに入れる
          </button>

          <button className="back-button" onClick={() => navigate(-1)}>戻る</button>
        </div>
      </div>
    </div>
  )
}
