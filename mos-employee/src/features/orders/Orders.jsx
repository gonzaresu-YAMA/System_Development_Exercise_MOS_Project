// 注文管理画面
// 役割：
// - 注文一覧の表示
// - 未確認 → 調理中 → 提供待ち → 完了 の状態遷移
// - 商品ごとの cooked チェック
// - フィルタ / 検索 / 件数表示 / ページング

import { useEffect, useMemo, useState } from 'react'
import './Orders.css'

import {
  loadOrders,
  saveOrders,
  searchOrders,
} from '../../domain/orders/orderDb'

const PER_PAGE = 8

const FILTERS = [
  { key: 'all', label: '全件' },
  { key: '未確認', label: '未確認' },
  { key: '調理中', label: '調理中' },
  { key: '提供待ち', label: '提供待ち' },
  { key: '完了', label: '完了' },
]

function Orders() {
  // =========================
  // state
  // =========================

  const [orders, setOrders] = useState(() => loadOrders())
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  // =========================
  // effect
  // =========================

  // 一覧が変わったら保存する
  useEffect(() => {
    saveOrders(orders)
  }, [orders])

  // =========================
  // 一覧の加工
  // =========================

  // 未確認件数
  const urgentCount = useMemo(
    () => orders.filter((o) => o.status === '未確認').length,
    [orders]
  )

  // 検索 + ステータスフィルタ済み一覧
  const filteredOrders = useMemo(
    () => searchOrders(orders, query, statusFilter),
    [orders, query, statusFilter]
  )

  const visibleCount = filteredOrders.length
  const totalCount = orders.length
  const totalPages = Math.max(1, Math.ceil(visibleCount / PER_PAGE))

  // currentPage を描画用に clamp する
  // lint 的に effect 内 setState を避けるため、この方法を採用している
  const currentPage = Math.min(page, totalPages)

  const pageOrders = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE
    return filteredOrders.slice(start, start + PER_PAGE)
  }, [filteredOrders, currentPage])

  // =========================
  // 状態遷移
  // =========================

  // 未確認 → 調理中
  const startCooking = (id) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id && o.status === '未確認'
          ? { ...o, status: '調理中' }
          : o
      )
    )
  }

  // 調理中の商品ごとの cooked 切り替え
  // 全商品 cooked になると、注文全体を提供待ちへ進める
  const toggleCooked = (orderId, itemIndex) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o
        if (o.status !== '調理中') return o

        const nextItems = o.items.map((item, idx) =>
          idx === itemIndex ? { ...item, cooked: !item.cooked } : item
        )

        const allCooked = nextItems.length > 0 && nextItems.every((item) => item.cooked)

        return {
          ...o,
          items: nextItems,
          status: allCooked ? '提供待ち' : '調理中',
        }
      })
    )
  }

  // 提供待ち → 完了
  const completeServing = (id) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id && o.status === '提供待ち'
          ? { ...o, status: '完了' }
          : o
      )
    )
  }

  // =========================
  // render
  // =========================

  return (
    <section className="orders">
      <header className="ordersHeader">
        <div className="ordersHeaderLeft">
          <h2 className="ordersTitle">注文管理</h2>
          <div className="ordersMeta">表示 {visibleCount} 件 / 全 {totalCount} 件</div>
        </div>

        {urgentCount > 0 && (
          <div className="urgentCount">
            未確認 <strong>{urgentCount}</strong> 件
          </div>
        )}
      </header>

      <div className="ordersTools">
        <div className="ordersFilters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`filterBtn ${statusFilter === f.key ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(f.key)
                setPage(1)
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          className="ordersSearch"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="検索（卓番号 / 商品名）"
        />
      </div>

      <div className="ordersList">
        {pageOrders.map((o) => (
          <article key={o.id} className={`orderCard status-${o.status}`}>
            <div className="orderTop">
              <div className="orderMain">
                <div className="orderTable">{o.table}</div>
                <div className="orderTime">{o.time}</div>
              </div>

              <span className={`statusBadge status-${o.status}`}>{o.status}</span>
            </div>

            <ul className="itemList">
              {o.items.map((it, idx) => (
                <li key={idx} className={`itemRow ${it.cooked ? 'done' : ''}`}>
                  <div className="itemLeft">
                    <button
                      type="button"
                      className={`cookCheck ${it.cooked ? 'checked' : ''}`}
                      onClick={() => toggleCooked(o.id, idx)}
                      disabled={o.status !== '調理中'}
                      title={o.status !== '調理中' ? '調理中のときだけ操作できます' : ''}
                    >
                      {it.cooked ? '✓' : ''}
                    </button>

                    <span className="itemName">{it.name}</span>
                  </div>

                  <span className="itemQty">× {it.qty}</span>
                </li>
              ))}
            </ul>

            <div className="orderActions">
              {o.status === '未確認' && (
                <button className="primaryBtn2" type="button" onClick={() => startCooking(o.id)}>
                  確認
                </button>
              )}

              {o.status === '調理中' && (
                <button className="waitingBtn" type="button" disabled>
                  全料理の調理完了で提供待ちになります
                </button>
              )}

              {o.status === '提供待ち' && (
                <button className="primaryBtn2" type="button" onClick={() => completeServing(o.id)}>
                  提供完了
                </button>
              )}

              {o.status === '完了' && (
                <button className="doneBtn" type="button" disabled>
                  完了済み
                </button>
              )}
            </div>
          </article>
        ))}

        {pageOrders.length === 0 && (
          <div className="emptyState">
            <p>該当する注文がありません。</p>
          </div>
        )}
      </div>

      {/* ページャー */}
      <nav className="pager" aria-label="ページ切り替え">
        <button
          className="pagerBtn"
          onClick={() => setPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          type="button"
        >
          ←
        </button>

        <div className="pagerNums">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`pagerNum ${n === currentPage ? 'active' : ''}`}
              onClick={() => setPage(n)}
              type="button"
            >
              {n}
            </button>
          ))}
        </div>

        <button
          className="pagerBtn"
          onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          type="button"
        >
          →
        </button>
      </nav>
    </section>
  )
}

export default Orders