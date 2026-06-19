import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../CartContext'
import menuItems from '../data/menuItems'
import useStayRemaining from '../hooks/useStayRemaining'
import '../App.css'
import '../menu.css'

export default function OrderConfirmPage() {
  const { cartItems, addToCart, removeFromCart } = useContext(CartContext)
  const { isExpired } = useStayRemaining()

  const getFallbackImage = (item) => {
    if (item.image) return item.image
    const found = menuItems.find((m) => String(m.id) === String(item.id) || m.name === item.name)
    return found?.image || ''
  }

  const grouped = cartItems.reduce((acc, item) => {
    const key = `${String(item.id)}|${item.name}`
    if (!acc[key]) {
      acc[key] = {
        name: item.name,
        price: item.price,
        itemId: item.id,
        image: item.image || getFallbackImage(item),
        items: []
      }
    }
    acc[key].items.push(item)
    return acc
  }, {})

  const rows = Object.values(grouped)

  const handleRemoveOne = (group) => {
    const target = group.items[0]
    if (target) removeFromCart(target.cartId)
  }

  const handleAddOne = (group) => {
    addToCart({ id: group.itemId, name: group.name, price: group.price, image: group.image })
  }

  const total = cartItems.reduce((sum, item) => sum + (item.price || 0), 0)

  return (
    <MenuLayout activeTab="hold">
      <div className="order-confirm-screen">
        <div className="order-confirm-card">
          <table className="order-table">
            <thead>
              <tr>
                <th className="order-col-name">商品名</th>
                <th className="order-col-thumb">画像</th>
                <th className="order-col-action">操作</th>
                <th className="order-col-qty">数量</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px' }}>
                    カートは空です
                  </td>
                </tr>
              ) : (
                rows.map((group) => (
                  <tr key={group.name}>
                    <td className="order-col-name">
                      <div style={{ fontFamily: 'var(--font-serif)' }}>{group.name}</div>
                      {group.price > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                          ¥{group.price} × {group.items.length}
                        </div>
                      )}
                    </td>
                    <td className="order-col-thumb">
                      {group.image ? (
                        <img src={group.image} alt={group.name} className="order-thumb" />
                      ) : (
                        <div className="order-thumb-placeholder" />
                      )}
                    </td>
                    <td className="order-col-action">
                      <div className="order-action-cell">
                        <button
                          type="button"
                          className="order-remove-pill"
                          onClick={() => handleRemoveOne(group)}
                          disabled={isExpired}
                        >
                          削除
                        </button>
                        <div className="order-stepper">
                          <button
                            type="button"
                            className="order-step-btn"
                            onClick={() => handleAddOne(group)}
                            disabled={isExpired}
                          >
                            ∧
                          </button>
                          <button
                            type="button"
                            className="order-step-btn"
                            onClick={() => handleRemoveOne(group)}
                            disabled={isExpired}
                          >
                            ∨
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="order-col-qty">{group.items.length}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {rows.length > 0 && (
            <div style={{
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border)',
              color: 'var(--gold)',
              fontSize: '0.92rem',
              fontWeight: 600
            }}>
              合計: ¥{total.toLocaleString()}
            </div>
          )}

          <div className="order-confirm-actions">
            {isExpired ? (
              <button type="button" className="order-confirm-send is-disabled" disabled>
                注文を確定して送信
              </button>
            ) : (
              <Link to="/order-send" className="order-confirm-send">
                注文を確定して送信
              </Link>
            )}
          </div>
        </div>
      </div>
    </MenuLayout>
  )
}
