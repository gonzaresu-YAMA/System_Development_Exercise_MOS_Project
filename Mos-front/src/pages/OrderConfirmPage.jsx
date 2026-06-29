/**
 * OrderConfirmPage.jsx — 注文保留確認ページ
 *
 * アクセス URL: /order-confirm
 *
 * 役割:
 *   カートに入れた商品（まだ送信していない注文）を一覧で確認し、
 *   数量の増減・削除・注文送信（/order-send）への遷移ができる画面。
 *
 * 「注文保留」とは?
 *   商品をカートに入れただけで、まだキッチンには送信されていない状態。
 *   この画面で内容を確認・修正してから「注文を確定して送信」する。
 *
 * 「グループ化」の仕組み:
 *   カートでは同じ商品でも1点ずつ別エントリーとして管理している。
 *   この画面では同じ商品をまとめて「商品名: 3点」のように表示するため、
 *   reduce を使って商品名 + ID の組み合わせでグループ化する。
 */

import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../contexts/CartContext'
import menuItems from '../data/menuItems'
import useStayRemaining from '../hooks/useStayRemaining'
import '../App.css'
import '../menu.css'

export default function OrderConfirmPage() {
  const { cartItems, addToCart, removeFromCart } = useContext(CartContext)
  const { isExpired } = useStayRemaining()

  /**
   * カートアイテムの画像を取得するフォールバック関数
   * カートアイテムに image が入っていない場合、menuItems から探して返す
   *
   * @param {{ id: number, name: string, image?: string }} item
   * @returns {string} 画像の URL（なければ空文字列）
   */
  const getFallbackImage = (item) => {
    if (item.image) return item.image
    const found = menuItems.find((m) => String(m.id) === String(item.id) || m.name === item.name)
    return found?.image || '' // ?. はオプショナルチェーン: found が undefined でもエラーにならない
  }

  /**
   * カートアイテムを商品ごとにグループ化する
   *
   * 例: カートに「ねぎま」が3件あれば、1行にまとめて「ねぎま × 3」と表示する
   *
   * reduce: 配列を1つのオブジェクト（acc）に集約するメソッド
   * key = "商品ID|商品名" の形式で同一商品かどうかを判定する
   * （ID だけだと異なる価格の同名商品がある場合に区別できないため名前も使う）
   *
   * グループの構造:
   *   { name, price, itemId, image, items: [カートアイテム...] }
   *   items 配列は削除操作で 1 件ずつ削除するときに cartId を参照するために必要
   */
  const grouped = cartItems.reduce((acc, item) => {
    const key = `${String(item.id)}|${item.name}`
    if (!acc[key]) {
      acc[key] = {
        name: item.name,
        price: item.price,
        itemId: item.id,
        image: item.image || getFallbackImage(item),
        items: [] // このグループに属するカートアイテムの配列
      }
    }
    acc[key].items.push(item) // 同じ商品をまとめる
    return acc
  }, {}) // 初期値は空オブジェクト

  // オブジェクト → 配列に変換して、JSX の .map() で繰り返し描画できるようにする
  const rows = Object.values(grouped)

  /**
   * グループから 1 件削除する
   * グループ内の最初のアイテム（items[0]）の cartId を使って 1 点だけ削除する
   * → 3 点あれば 1 点ずつ減らせる
   */
  const handleRemoveOne = (group) => {
    const target = group.items[0]
    if (target) removeFromCart(target.cartId)
  }

  /**
   * グループに 1 件追加する
   * 既存のグループの情報（name, price, image）を使って addToCart を呼ぶ
   */
  const handleAddOne = (group) => {
    addToCart({ id: group.itemId, name: group.name, price: group.price, image: group.image })
  }

  // カート内の合計金額を計算する
  // reduce でカートの全アイテムの price を足し合わせる
  // item.price || 0: price が undefined や null の場合は 0 として扱う（無料備品など）
  const total = cartItems.reduce((sum, item) => sum + (item.price || 0), 0)

  return (
    <MenuLayout activeTab="hold">
      <div className="order-confirm-screen">
        <div className="order-confirm-card">

          {/* 注文一覧テーブル */}
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
                // カートが空のとき: 全列を結合して「カートは空です」と表示
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px' }}>
                    カートは空です
                  </td>
                </tr>
              ) : (
                rows.map((group) => (
                  <tr key={group.name}>
                    {/* 商品名 + 価格（0円の無料商品は価格表示しない） */}
                    <td className="order-col-name">
                      <div style={{ fontFamily: 'var(--font-serif)' }}>{group.name}</div>
                      {group.price > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                          ¥{group.price} × {group.items.length}
                        </div>
                      )}
                    </td>

                    {/* 商品サムネイル画像 */}
                    <td className="order-col-thumb">
                      {group.image ? (
                        <img src={group.image} alt={group.name} className="order-thumb" />
                      ) : (
                        <div className="order-thumb-placeholder" />
                      )}
                    </td>

                    {/* 操作ボタン（削除・増減） */}
                    <td className="order-col-action">
                      <div className="order-action-cell">
                        {/* 「削除」ボタン: 1点削除する */}
                        <button
                          type="button"
                          className="order-remove-pill"
                          onClick={() => handleRemoveOne(group)}
                          disabled={isExpired}
                        >
                          削除
                        </button>

                        {/* ∧▽ のステッパーボタン: 数量増減 */}
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

                    {/* 数量（グループ内のアイテム数） */}
                    <td className="order-col-qty">{group.items.length}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 合計金額の表示（カートが空でないときだけ表示） */}
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
              {/* toLocaleString(): 1234 → '1,234' のようにカンマ区切りで表示 */}
              合計: ¥{total.toLocaleString()}
            </div>
          )}

          {/* 注文送信ボタン */}
          <div className="order-confirm-actions">
            {isExpired ? (
              // 時間切れの場合: 押せないボタン
              <button type="button" className="order-confirm-send is-disabled" disabled>
                注文を確定して送信
              </button>
            ) : (
              // 通常の場合: /order-send へのリンク（クリックで注文送信画面へ）
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
