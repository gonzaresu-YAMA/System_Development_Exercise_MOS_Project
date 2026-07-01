/**
 * 注文管理画面（厨房用途）
 *
 * 厨房スタッフが使う画面。本日の全注文を表示し、
 * 「調理開始 → 料理完了チェック → 提供完了」の流れを管理する。
 *
 * 注文ステータスの流れ:
 *   未確認 → [確認ボタン] → 調理中 → [全料理にチェック] → 提供待ち → [提供完了ボタン] → 完了
 *
 * 主な機能:
 *   - 30秒ごとの自動更新（ポーリング）
 *   - ステータスフィルタ・フリーワード検索
 *   - ページング（1ページ最大8件）
 *   - 未確認件数の表示（緊急バッジ）
 *   - 楽観的更新（API 完了を待たずに画面を先に更新）
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import './Orders.css'

import {
  loadOrders,
  searchOrders,
} from '../../domain/orders/orderDb'
import { orderApi } from '../../services/api.js'

// 1ページに表示する注文数
const PER_PAGE = 8

// ステータスフィルタボタンの定義
const FILTERS = [
  { key: 'all',    label: '全件' },
  { key: '未確認', label: '未確認' },
  { key: '調理中', label: '調理中' },
  { key: '提供待ち', label: '提供待ち' },
  { key: '完了',   label: '完了' },
]

function Orders() {
  const [orders, setOrders] = useState([])       // 全注文リスト
  const [statusFilter, setStatusFilter] = useState('all')  // 選択中のステータスフィルタ
  const [query, setQuery] = useState('')          // 検索ワード
  const [page, setPage] = useState(1)             // 現在のページ番号
  const [loading, setLoading] = useState(true)   // 初回読み込み中フラグ

  // 注文を取得する関数を useCallback でメモ化する
  // メモ化する理由: useEffect の依存配列に渡すとき、毎回新しい関数が生成されると
  // 無限ループになるため、同じ関数参照を使い回す必要がある
  const fetchOrders = useCallback(async () => {
    try {
      const data = await loadOrders()
      setOrders(data)
    } catch (e) {
      console.error('注文取得エラー:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初回ロード + 30秒ごとの自動更新
  // 厨房では顧客の注文がリアルタイムに来るため、定期的に取得する
  // clearInterval を return することでコンポーネントが消えたときにタイマーを止める
  useEffect(() => {
    fetchOrders()
    const timer = setInterval(fetchOrders, 30_000)
    return () => clearInterval(timer)
  }, [fetchOrders])

  // 未確認件数（ヘッダーの緊急バッジ表示用）
  const urgentCount = useMemo(
    () => orders.filter((o) => o.status === '未確認').length,
    [orders]
  )

  // フィルタ・検索を適用した注文リスト（searchOrders は sortOrders も内包）
  const filteredOrders = useMemo(
    () => searchOrders(orders, query, statusFilter),
    [orders, query, statusFilter]
  )

  const visibleCount = filteredOrders.length
  const totalCount   = orders.length
  const totalPages   = Math.max(1, Math.ceil(visibleCount / PER_PAGE))
  // フィルタ変更でページが総ページ数を超えた場合に補正する
  const currentPage  = Math.min(page, totalPages)

  // 現在のページに表示する注文だけを切り出す
  const pageOrders = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE
    return filteredOrders.slice(start, start + PER_PAGE)
  }, [filteredOrders, currentPage])

  // 「確認」ボタン: 未確認 → 調理中 に変更
  const startCooking = async (o) => {
    try {
      const updated = await orderApi.startCooking(o._numId)
      // イミュータブルに更新: 対象注文だけサーバー返却値で置き換える
      setOrders((prev) => prev.map((x) => (x.id === o.id ? updated : x)))
    } catch (e) {
      console.error('調理開始エラー:', e)
    }
  }

  /**
   * 個別アイテムの調理完了チェックボックスをトグルする
   *
   * 楽観的更新を行っている理由:
   *   API 完了を待つとチェックの反応が遅れてUXが悪くなるため、
   *   まずローカルのステートを更新してから非同期でバックエンドを同期する。
   *
   * 全アイテムにチェックが入ったら自動的に markReady を呼ぶ:
   *   調理者が全て完了させた瞬間にステータスが「提供待ち」に遷移する
   */
  const toggleCooked = async (orderId, itemIndex) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o
        if (o.status !== '調理中') return o  // 調理中以外は操作不可

        // 対象アイテムの cooked フラグを反転
        const nextItems = o.items.map((item, idx) =>
          idx === itemIndex ? { ...item, cooked: !item.cooked } : item
        )
        // 全アイテムが調理完了かどうかチェック
        const allCooked = nextItems.length > 0 && nextItems.every((item) => item.cooked)

        if (allCooked) {
          // 全完了 → バックエンドを「提供待ち」に更新（非同期で別途実行）
          orderApi.markReady(o._numId)
            .then((updated) => setOrders((prev2) => prev2.map((x) => (x.id === o.id ? updated : x))))
            .catch((e) => console.error('提供待ち更新エラー:', e))
        }

        // ローカルステートは即時更新（楽観的更新）
        return { ...o, items: nextItems, status: allCooked ? '提供待ち' : '調理中' }
      })
    )
  }

  // 「提供完了」ボタン: 提供待ち → 完了 に変更
  const completeServing = async (o) => {
    try {
      const updated = await orderApi.markServed(o._numId)
      setOrders((prev) => prev.map((x) => (x.id === o.id ? updated : x)))
    } catch (e) {
      console.error('提供完了エラー:', e)
    }
  }

  if (loading) {
    return <section className="orders"><p style={{ padding: '2rem' }}>読み込み中…</p></section>
  }

  return (
    <section className="orders">
      <header className="ordersHeader">
        <div className="ordersHeaderLeft">
          <h2 className="ordersTitle">注文管理</h2>
          <div className="ordersMeta">
            表示 {visibleCount} 件 / 全 {totalCount} 件
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {urgentCount > 0 && (
            <div className="urgentCount">
              未確認 <strong>{urgentCount}</strong> 件
            </div>
          )}
          <button type="button" className="filterBtn" onClick={fetchOrders}>更新</button>
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
                <button className="primaryBtn2" type="button" onClick={() => startCooking(o)}>
                  確認
                </button>
              )}

              {o.status === '調理中' && (
                <button className="waitingBtn" type="button" disabled>
                  全料理の調理完了で提供待ちになります
                </button>
              )}

              {o.status === '提供待ち' && (
                <button className="primaryBtn2" type="button" onClick={() => completeServing(o)}>
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

      <nav className="pager" aria-label="ページ切り替え">
        <button
          className="pagerBtn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          type="button"
        >
          ←
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
          →
        </button>
      </nav>
    </section>
  )
}

export default Orders
