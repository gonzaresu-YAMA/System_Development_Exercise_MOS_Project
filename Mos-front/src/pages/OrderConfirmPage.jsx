import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../CartContext'
import useStayRemaining from '../hooks/useStayRemaining'
import '../menu.css'

export default function OrderConfirmPage() {
  const { cartItems, addToCart, removeFromCart } = useContext(CartContext)
  const { isExpired } = useStayRemaining()

  const grouped = cartItems.reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = { name: item.name, price: item.price, items: [] }
    }
    acc[item.name].items.push(item)
    return acc
  }, {})

  const rows = Object.values(grouped)

  const handleRemoveOne = (group) => {
    const target = group.items[0]
    if (target) {
      removeFromCart(target.cartId)
    }
  }

  const handleAddOne = (group) => {
    addToCart({ id: Date.now(), name: group.name, price: group.price })
  }

  return (
    <MenuLayout activeTab="hold">
      <div className="order-confirm-screen">
        <div className="order-confirm-card">
          <table className="order-table">
            <thead>
              <tr>
                <th className="order-col-name">名称</th>
                <th className="order-col-action">&nbsp;</th>
                <th className="order-col-qty">数量</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="order-col-name">&nbsp;</td>
                  <td className="order-col-action">&nbsp;</td>
                  <td className="order-col-qty">&nbsp;</td>
                </tr>
              ) : (
                rows.map((group) => (
                  <tr key={group.name}>
                    <td className="order-col-name">{group.name}</td>
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
                            aria-label="数量を増やす"
                            disabled={isExpired}
                          >
                            ∧
                          </button>
                          <button
                            type="button"
                            className="order-step-btn"
                            onClick={() => handleRemoveOne(group)}
                            aria-label="数量を減らす"
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
