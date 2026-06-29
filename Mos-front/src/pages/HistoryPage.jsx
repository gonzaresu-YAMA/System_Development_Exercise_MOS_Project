/**
 * HistoryPage.jsx — 注文履歴ページ
 *
 * アクセス URL: /history
 *
 * 役割:
 *   今セッション中に送信した注文の合計を商品ごとに集計して一覧表示する。
 *   「いつ何を注文したか」をお客様が確認できる画面。
 *
 * データの流れ:
 *   バックエンドAPI（orderApi.getOrdersByTable）
 *     → orderHistoryRepository.load() でフロント形式に変換
 *       → CartContext の orderHistory に保存
 *         → このページで表示
 *
 * 集計ロジック:
 *   注文履歴は「注文単位」でまとまっている（例: 第1回注文、第2回注文）。
 *   このページでは全注文をフラットに展開して商品ごとの合計数量を表示する。
 *   例: 第1回注文「ねぎま×2」+ 第2回注文「ねぎま×1」→ 「ねぎま 3点」と表示
 */

import { useContext } from 'react'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../contexts/CartContext'
import '../App.css'
import '../menu.css'

export default function HistoryPage() {
  // CartContext から注文履歴を取得する
  // orderHistory の形式: [{ id, createdAt, items: [{ name, qty }] }, ...]
  const { orderHistory } = useContext(CartContext)

  // ── 全注文を単一の商品リストに展開する ──────────────────────
  // flatMap: 各注文の items 配列を展開（フラット化）して1つの配列にまとめる
  // 例: [{ items: [A, B] }, { items: [C] }] → [A, B, C]
  const allItems = orderHistory.flatMap((order) =>
    Array.isArray(order.items) ? order.items : [] // items がない場合は空配列に
  )

  // ── 商品ごとに数量を集計する ──────────────────────────────
  // reduce: 配列を1つのオブジェクト（acc）に集約する
  // 結果の形式: { 'ねぎま': 3, 'もも': 1, ... }
  const counts = allItems.reduce((acc, item) => {
    // item.name または item.itemName（データ形式の揺れに対応）
    const name = item.name || item.itemName || ''

    // item.qty または item.quantity（バックエンドの形式の揺れに対応）
    // ?? 演算子（nullish coalescing）: null または undefined の場合だけ右辺を使う
    const qty = item.qty ?? item.quantity ?? 1

    // 既にキーが存在すれば数量を加算、なければ新しく登録
    acc[name] = (acc[name] || 0) + qty
    return acc
  }, {})

  // ── 表示用の配列に変換する ────────────────────────────────
  // Object.entries: { ねぎま: 3 } → [['ねぎま', 3]] に変換
  // map で { name, qty } のオブジェクト形式に変換
  const rows = Object.entries(counts).map(([name, qty]) => ({ name, qty }))

  return (
    <MenuLayout activeTab="history">
      {/* ページタイトル */}
      <div className="category-title">注文履歴</div>

      <div className="history-card">
        {rows.length === 0 ? (
          // 注文履歴がない場合のメッセージ
          <div style={{
            padding: '48px 20px',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: '0.9rem'
          }}>
            まだ注文履歴がありません
          </div>
        ) : (
          // 注文履歴テーブル
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
                // key は「商品名 + インデックス」で設定
                // ※ 同じ商品名が複数あり得るため、インデックスを組み合わせる
                <tr key={`${row.name}-${i}`}>
                  <td className="history-col-name">{row.name}</td>
                  <td className="history-col-status">
                    {/* 現在は「注文済」固定。将来的にキッチンのステータスを反映できる */}
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
