import { useContext } from 'react'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../CartContext'
import '../menu.css'

export default function HistoryPage() {
  const { orderHistory } = useContext(CartContext)

  const counts = orderHistory
    .flatMap(order => order.items)
    .reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + 1
      return acc
    }, {})

  const rows = Object.entries(counts).map(([name, qty]) => ({
    name,
    status: '未',
    qty
  }))

  const displayRows = rows.slice(0, 6)
  while (displayRows.length < 6) {
    displayRows.push({ name: '', status: '', qty: '' })
  }

  return (
    <MenuLayout activeTab="history">
      <div className="history-card">
        <table className="history-table">
          <thead>
            <tr>
              <th className="history-col-name">名称</th>
              <th className="history-col-status">
                <span className="history-status-header" aria-label="状態">
                  <span className="history-status-icon">✓</span>
                </span>
              </th>
              <th className="history-col-qty">数量</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => (
              <tr key={`${row.name}-${index}`}>
                <td className="history-col-name">{row.name || '\u00A0'}</td>
                <td className="history-col-status">
                  <span className="history-status-text">
                    {row.status || '\u00A0'}
                  </span>
                </td>
                <td className="history-col-qty">{row.qty || '\u00A0'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="history-pagination">
          <span>◀</span>
          <span>1/1</span>
          <span>▶</span>
        </div>
      </div>
    </MenuLayout>
  )
}
