import { useContext } from 'react'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../contexts/CartContext'
import '../App.css'
import '../menu.css'

export default function HistoryPage() {
  const { orderHistory } = useContext(CartContext)

  const allItems = orderHistory.flatMap((order) =>
    Array.isArray(order.items) ? order.items : []
  )

  const counts = allItems.reduce((acc, item) => {
    acc[item.name] = (acc[item.name] || 0) + 1
    return acc
  }, {})

  const rows = Object.entries(counts).map(([name, qty]) => ({ name, qty }))

  return (
    <MenuLayout activeTab="history">
      <div className="category-title">注文履歴</div>

      <div className="history-card">
        {rows.length === 0 ? (
          <div style={{
            padding: '48px 20px',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: '0.9rem'
          }}>
            まだ注文履歴がありません
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th className="history-col-name">商品名</th>
                <th className="history-col-status">状態</th>
                <th className="history-col-qty">数量</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.name}-${i}`}>
                  <td className="history-col-name">{row.name}</td>
                  <td className="history-col-status">
                    <span className="history-status-text">注文済</span>
                  </td>
                  <td className="history-col-qty">{row.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MenuLayout>
  )
}
