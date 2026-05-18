import { useMemo, useState, useEffect } from 'react'
import './Orders.css'

const PER_PAGE = 8

const initialOrders = [
  {
    id: 'o1',
    table: 'T1',
    time: '12:00',
    status: '未確認',
    items: [
      { name: '枝豆', qty: 1 },
      { name: '唐揚げ', qty: 2 },
      { name: 'ハイボール', qty: 2 },
    ],
  },
  {
    id: 'o2',
    table: 'T2',
    time: '13:00',
    status: '調理中',
    items: [
      { name: 'ポテト', qty: 1 },
      { name: 'レモンサワー', qty: 2 },
    ],
  },
  {
    id: 'o3',
    table: 'C1',
    time: '13:45',
    status: '提供待ち',
    items: [
      { name: '刺身盛り', qty: 1 },
      { name: '日本酒', qty: 1 },
    ],
  },
  {
    id: 'o4',
    table: 'C2',
    time: '14:10',
    status: '未確認',
    items: [
      { name: 'お茶', qty: 2 },
    ],
  },
]

function Orders() {
  const [orders, setOrders] = useState(initialOrders)
  const [page, setPage] = useState(1)

  // 完了確認ダイアログ用
  const [confirmTarget, setConfirmTarget] = useState(null)

  // 並び順：未確認 → 調理中 → 提供待ち → 完了
  const sortedOrders = useMemo(() => {
    const rank = { '未確認': 0, '調理中': 1, '提供待ち': 2, '完了': 3 }
    return [...orders].sort(
      (a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
    )
  }, [orders])

  // ✅ 未確認件数
  const urgentCount = useMemo(
    () => orders.filter(o => o.status === '未確認').length,
    [orders]
  )

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / PER_PAGE))

  // 完了で件数が減ってページがはみ出た時の調整
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageOrders = useMemo(() => {
    const start = (page - 1) * PER_PAGE
    return sortedOrders.slice(start, start + PER_PAGE)
  }, [sortedOrders, page])

  // 完了 → 確認表示
  const requestComplete = (order) => {
    setConfirmTarget(order)
  }

  // 確認OK → 削除（＝次が繰り上がる）
  const confirmComplete = () => {
    if (!confirmTarget) return
    setOrders(prev => prev.filter(o => o.id !== confirmTarget.id))
    setConfirmTarget(null)
  }

  const cancelComplete = () => setConfirmTarget(null)

  return (
    <section className="orders">
      {/* ヘッダー */}
      <header className="ordersHeader">
        <h2 className="ordersTitle">注文管理</h2>

        {urgentCount > 0 && (
          <div className="urgentCount">
            未確認 <strong>{urgentCount}</strong> 件
          </div>
        )}
      </header>

      {/* 一覧 */}
      <div className="ordersList">
        {pageOrders.map(o => (
          <article
            key={o.id}
            className={`orderCard status-${o.status}`}
          >
            {/* 上段 */}
            <div className="orderTop">
              <div className="orderMain">
                <div className="orderTable">{o.table}</div>
                <div className="orderTime">{o.time}</div>
              </div>
              <span className={`statusBadge status-${o.status}`}>
                {o.status}
              </span>
            </div>

            {/* 商品一覧 */}
            <ul className="itemList">
              {o.items.map((it, idx) => (
                <li key={idx} className="itemRow">
                  <span className="itemName">{it.name}</span>
                  <span className="itemQty">× {it.qty}</span>
                </li>
              ))}
            </ul>

            {/* 操作 */}
            <div className="orderActions">
              <button className="ghostBtn2" type="button">
                確認
              </button>
              <button
                className="primaryBtn2"
                type="button"
                onClick={() => requestComplete(o)}
              >
                完了
              </button>
            </div>
          </article>
        ))}

        {pageOrders.length === 0 && (
          <div className="emptyState">
            <p>このページには注文がありません。</p>
          </div>
        )}
      </div>

      {/* ページャー */}
      <nav className="pager">
        <button
          className="pagerBtn"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ←
        </button>

        <div className="pagerNums">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              className={`pagerNum ${n === page ? 'active' : ''}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          className="pagerBtn"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          →
        </button>
      </nav>

      {/* 完了確認ダイアログ */}
      {confirmTarget && (
        <>
          <div className="confirmOverlay" onClick={cancelComplete} />
          <div className="confirmModal">
            <h3 className="confirmTitle">完了にしますか？</h3>
            <p className="confirmText">
              <strong>{confirmTarget.table}</strong>（{confirmTarget.time}）の注文を完了にします。
              <br />
              完了にすると一覧から消えます。
            </p>

            <div className="confirmActions">
              <button className="ghostBtn2" onClick={cancelComplete}>
                キャンセル
              </button>
              <button className="dangerBtn" onClick={confirmComplete}>
                OK（完了）
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default Orders