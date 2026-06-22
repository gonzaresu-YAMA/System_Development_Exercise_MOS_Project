import { useCallback, useEffect, useMemo, useState } from 'react'
import './Orders.css'

import {
  loadOrders,
  searchOrders,
} from '../../domain/orders/orderDb'
import { orderApi } from '../../services/api.js'

const PER_PAGE = 8

const FILTERS = [
  { key: 'all', label: '蜈ｨ莉ｶ' },
  { key: '譛ｪ遒ｺ隱・, label: '譛ｪ遒ｺ隱・ },
  { key: '隱ｿ逅・ｸｭ', label: '隱ｿ逅・ｸｭ' },
  { key: '謠蝉ｾ帛ｾ・■', label: '謠蝉ｾ帛ｾ・■' },
  { key: '螳御ｺ・, label: '螳御ｺ・ },
]

function Orders() {
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    try {
      const data = await loadOrders()
      setOrders(data)
    } catch (e) {
      console.error('豕ｨ譁・叙蠕励お繝ｩ繝ｼ:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    // 30遘偵＃縺ｨ縺ｫ閾ｪ蜍墓峩譁ｰ
    const timer = setInterval(fetchOrders, 30_000)
    return () => clearInterval(timer)
  }, [fetchOrders])

  const urgentCount = useMemo(
    () => orders.filter((o) => o.status === '譛ｪ遒ｺ隱・).length,
    [orders]
  )

  const filteredOrders = useMemo(
    () => searchOrders(orders, query, statusFilter),
    [orders, query, statusFilter]
  )

  const visibleCount = filteredOrders.length
  const totalCount = orders.length
  const totalPages = Math.max(1, Math.ceil(visibleCount / PER_PAGE))
  const currentPage = Math.min(page, totalPages)

  const pageOrders = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE
    return filteredOrders.slice(start, start + PER_PAGE)
  }, [filteredOrders, currentPage])

  const startCooking = async (o) => {
    try {
      const updated = await orderApi.startCooking(o._numId)
      setOrders((prev) => prev.map((x) => (x.id === o.id ? updated : x)))
    } catch (e) {
      console.error('隱ｿ逅・幕蟋九お繝ｩ繝ｼ:', e)
    }
  }

  const toggleCooked = async (orderId, itemIndex) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o
        if (o.status !== '隱ｿ逅・ｸｭ') return o

        const nextItems = o.items.map((item, idx) =>
          idx === itemIndex ? { ...item, cooked: !item.cooked } : item
        )
        const allCooked = nextItems.length > 0 && nextItems.every((item) => item.cooked)

        if (allCooked) {
          // 蜈ｨ繧｢繧､繝・Β隱ｿ逅・ｮ御ｺ・竊・繝舌ャ繧ｯ繧ｨ繝ｳ繝峨ｒ READY 縺ｫ譖ｴ譁ｰ
          orderApi.markReady(o._numId)
            .then((updated) => setOrders((prev2) => prev2.map((x) => (x.id === o.id ? updated : x))))
            .catch((e) => console.error('謠蝉ｾ帛ｾ・■譖ｴ譁ｰ繧ｨ繝ｩ繝ｼ:', e))
        }

        return { ...o, items: nextItems, status: allCooked ? '謠蝉ｾ帛ｾ・■' : '隱ｿ逅・ｸｭ' }
      })
    )
  }

  const completeServing = async (o) => {
    try {
      const updated = await orderApi.markServed(o._numId)
      setOrders((prev) => prev.map((x) => (x.id === o.id ? updated : x)))
    } catch (e) {
      console.error('謠蝉ｾ帛ｮ御ｺ・お繝ｩ繝ｼ:', e)
    }
  }

  if (loading) {
    return <section className="orders"><p style={{ padding: '2rem' }}>隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ窶ｦ</p></section>
  }

  return (
    <section className="orders">
      <header className="ordersHeader">
        <div className="ordersHeaderLeft">
          <h2 className="ordersTitle">豕ｨ譁・ｮ｡逅・/h2>
          <div className="ordersMeta">
            陦ｨ遉ｺ {visibleCount} 莉ｶ / 蜈ｨ {totalCount} 莉ｶ
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {urgentCount > 0 && (
            <div className="urgentCount">
              譛ｪ遒ｺ隱・<strong>{urgentCount}</strong> 莉ｶ
            </div>
          )}
          <button type="button" className="filterBtn" onClick={fetchOrders}>譖ｴ譁ｰ</button>
        </div>
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
          placeholder="讀懃ｴ｢・亥酷逡ｪ蜿ｷ / 蝠・刀蜷搾ｼ・
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
                      disabled={o.status !== '隱ｿ逅・ｸｭ'}
                      title={o.status !== '隱ｿ逅・ｸｭ' ? '隱ｿ逅・ｸｭ縺ｮ縺ｨ縺阪□縺第桃菴懊〒縺阪∪縺・ : ''}
                    >
                      {it.cooked ? '笨・ : ''}
                    </button>

                    <span className="itemName">{it.name}</span>
                  </div>

                  <span className="itemQty">ﾃ・{it.qty}</span>
                </li>
              ))}
            </ul>

            <div className="orderActions">
              {o.status === '譛ｪ遒ｺ隱・ && (
                <button className="primaryBtn2" type="button" onClick={() => startCooking(o)}>
                  遒ｺ隱・
                </button>
              )}

              {o.status === '隱ｿ逅・ｸｭ' && (
                <button className="waitingBtn" type="button" disabled>
                  蜈ｨ譁咏炊縺ｮ隱ｿ逅・ｮ御ｺ・〒謠蝉ｾ帛ｾ・■縺ｫ縺ｪ繧翫∪縺・
                </button>
              )}

              {o.status === '謠蝉ｾ帛ｾ・■' && (
                <button className="primaryBtn2" type="button" onClick={() => completeServing(o)}>
                  謠蝉ｾ帛ｮ御ｺ・
                </button>
              )}

              {o.status === '螳御ｺ・ && (
                <button className="doneBtn" type="button" disabled>
                  螳御ｺ・ｸ医∩
                </button>
              )}
            </div>
          </article>
        ))}

        {pageOrders.length === 0 && (
          <div className="emptyState">
            <p>隧ｲ蠖薙☆繧区ｳｨ譁・′縺ゅｊ縺ｾ縺帙ｓ縲・/p>
          </div>
        )}
      </div>

      <nav className="pager" aria-label="繝壹・繧ｸ蛻・ｊ譖ｿ縺・>
        <button
          className="pagerBtn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          type="button"
        >
          竊・
        </button>

        <div className="pagerNums">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`pagerNum ${n === page ? 'active' : ''}`}
              onClick={() => setPage(n)}
              type="button"
            >
              {n}
            </button>
          ))}
        </div>

        <button
          className="pagerBtn"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          type="button"
        >
          竊・
        </button>
      </nav>
    </section>
  )
}

export default Orders

