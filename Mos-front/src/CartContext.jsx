/**
 * CartContext.jsx — カートの状態管理と注文ロジック（Provider）
 *
 * 「なぜこのファイルが必要か?」
 *   カート情報（カートに入れた商品・注文履歴）は、メニューページ・注文確認ページ・
 *   注文送信ページなど複数のページから参照・更新される。
 *   各ページに別々で持たせると同期が難しくなるため、Context に一元管理する。
 *
 * 「CartContext.jsx が2つある?」
 *   src/contexts/CartContext.jsx → Context オブジェクトを「作る」だけのファイル
 *   src/CartContext.jsx (このファイル) → 実際のデータと操作を「提供する」CartProvider
 *
 * CartProvider の提供する値（子コンポーネントが useContext で取得できるもの）:
 *   - cartItems:        カート内の商品リスト（まだ注文送信していないもの）
 *   - cartCount:        カートの件数（バッジ表示用）
 *   - addToCart:        商品をカートに追加する関数
 *   - removeFromCart:   商品をカートから削除する関数
 *   - resetCart:        カートを空にする関数
 *   - resetOrderHistory: 注文履歴を空にする関数
 *   - orderHistory:     過去に送信した注文の履歴
 *   - confirmOrder:     注文を確定してバックエンドへ送信する関数
 */

import { useEffect, useState } from 'react'
import { orderHistoryRepository } from './services/orderHistoryRepository'
import { orderApi } from './services/api'
import { isStayExpired } from './utils/stayTimer'
import { CartContext } from './contexts/CartContext'

// ── カートID生成 ────────────────────────────────────────────
// カートに追加した商品それぞれに一意なIDを割り当てるためのカウンター
// 例: 「もも」を3点追加すると、それぞれが別のcartIdを持つ
//    → 1点だけ削除したいとき、どの1点を削除するか特定できる
let cartIdCounter = 0

/**
 * カートアイテム用の一意なIDを生成する
 * ブラウザが crypto.randomUUID をサポートしていれば UUID を返す
 * サポートしていない古いブラウザでは連番フォールバックを使う
 */
const generateCartId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID() // 例: "550e8400-e29b-41d4-a716-446655440000"
  }
  cartIdCounter += 1
  return `cart-${cartIdCounter}` // 例: "cart-1", "cart-2"
}

/**
 * CartProvider — カートの状態をアプリ全体に提供するコンポーネント
 *
 * App.jsx で <CartProvider> として使われ、内部のすべてのコンポーネントが
 * useContext(CartContext) でカート操作を取得できるようになる。
 *
 * @param {{ children: React.ReactNode }} props
 */
export function CartProvider({ children }) {
  // ── 状態の定義 ─────────────────────────────────────────────

  // cartItems: カートに入っている商品の配列
  // 初期値は空配列。商品を追加するたびに要素が増える。
  const [cartItems, setCartItems] = useState([])

  // orderHistory: 過去に注文送信した注文の配列（バックエンドから取得）
  // 各要素は { id, createdAt, items: [{ name, qty }] } の形
  const [orderHistory, setOrderHistory] = useState([])

  // hasLoadedHistory: 注文履歴の初回ロードが完了したかのフラグ
  // ロード完了前に save() が走ってしまうのを防ぐために使う
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false)

  // ── 初回マウント時に注文履歴をバックエンドから読み込む ──────

  useEffect(() => {
    // active フラグ: コンポーネントがアンマウントされた後（ページ離脱後）に
    // setState が呼ばれるのを防ぐためのガード変数
    // ※ setState はアンマウント後に呼ぶとメモリリークの警告が出る
    let active = true

    orderHistoryRepository
      .load()
      .then((history) => {
        if (active) {
          setOrderHistory(history)
          setHasLoadedHistory(true)
        }
      })
      .catch(() => {
        // ロード失敗（ネットワークエラーなど）のときは空配列で初期化
        // エラーをそのまま投げると画面が壊れるため、安全な初期値に落とす
        if (active) {
          setOrderHistory([])
          setHasLoadedHistory(true)
        }
      })

    // クリーンアップ関数: このエフェクトが再実行される直前またはコンポーネント破棄時に呼ばれる
    return () => { active = false }
  }, []) // 空の依存配列 [] = コンポーネントの初回マウント時のみ実行

  // ── 注文履歴が変わるたびにバックエンドへ保存 ────────────────

  useEffect(() => {
    // 初回ロード完了前に save が走らないようにガード
    if (!hasLoadedHistory) return

    // ※ バックエンドが注文の主記録のため、orderHistoryRepository.save は no-op
    //   （何もしない関数）だが、インターフェースとして呼び出す形を維持している
    orderHistoryRepository.save(orderHistory).catch(() => {
      console.warn('Failed to save order history.')
    })
  }, [orderHistory, hasLoadedHistory]) // orderHistory が変わるたびに実行

  // ── カート操作関数 ──────────────────────────────────────────

  /**
   * カートに商品を1点追加する
   *
   * 飲み放題プランの滞在時間が切れている場合は追加を拒否する
   * （時間切れ後に注文されることを防ぐ）
   *
   * スプレッド演算子 {...item} でアイテムを「コピー」しつつ
   * cartId を付加することで、同じ商品でも個別に追跡できる
   *
   * @param {{ id: number, name: string, price: number, image: string }} item
   */
  const addToCart = (item) => {
    if (isStayExpired()) return
    // prev（前の状態）を受け取って新しい配列を返す関数形式で setCartItems を呼ぶ
    // これにより、非同期な複数回の更新でも確実に最新の状態に追加できる
    setCartItems((prev) => [...prev, { ...item, cartId: generateCartId() }])
  }

  /**
   * カートから指定した cartId のアイテムを1点削除する
   *
   * filter は「条件を満たす要素だけを残した新しい配列」を返す。
   * 元の配列は変更しない（イミュータブル更新）。
   * これが React の状態更新の基本パターン。
   *
   * @param {string} cartId - 削除対象のカートID
   */
  const removeFromCart = (cartId) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId))
  }

  /** カートをすべて空にする（注文送信後・会計後に呼ぶ） */
  const resetCart = () => setCartItems([])

  /** 注文履歴をすべて空にする（会計後のセッションリセットに使う） */
  const resetOrderHistory = () => setOrderHistory([])

  /**
   * カート内の注文をバックエンドに送信して確定する
   *
   * ── 処理の流れ ──────────────────────────────────────────
   *   1. 滞在時間切れ または カートが空なら何もしない → false を返す
   *   2. ローカルに注文履歴を即座に追記（UI の即時反映のため）
   *   3. カートを空にする
   *   4. バックエンドAPIへ注文データを POST で送信
   *      ※ APIエラーが起きてもローカル記録は保持する
   *         → ネットワーク障害時でも注文履歴が消えないようにする
   * ────────────────────────────────────────────────────────
   *
   * async/await: 非同期処理（API通信）を「待って」から次の処理に進む書き方
   * @returns {Promise<boolean>} 注文が確定されたら true、できなかったら false
   */
  const confirmOrder = async () => {
    if (isStayExpired()) return false
    if (cartItems.length === 0) return false

    // ローカル記録用の注文オブジェクト
    // Date.now(): 現在時刻のミリ秒数 = 一時的なIDとして使う
    // new Date().toISOString(): "2024-01-15T10:30:00.000Z" 形式の日時文字列
    const localOrder = {
      id: Date.now(),
      items: cartItems,
      createdAt: new Date().toISOString()
    }

    // 新しい注文を履歴の「先頭」に追加（最新が上に表示されるように）
    // prev を受け取って [localOrder, ...prev] = 新注文 + 既存履歴 の新配列を返す
    setOrderHistory((prev) => [localOrder, ...prev])
    setCartItems([]) // カートをリセット（ユーザーには空カートがすぐ見える）

    // バックエンドへ非同期で送信
    // try/catch でエラーを拾い、失敗してもアプリのクラッシュを防ぐ
    try {
      // sessionStorage から座席IDとコース種別を取得（コース選択画面で保存済み）
      const seatId = sessionStorage.getItem('seatId') || '1'
      const courseType = sessionStorage.getItem('selectedCourse') || 'normal'

      const orderRequest = {
        seatId: Number(seatId),   // バックエンドは数値を期待しているため Number() で変換
        courseType,
        // カートの各アイテムをバックエンドが期待する形式に変換
        // カートでは 1商品 = 1エントリー として管理しているため quantity は常に 1
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          itemName: item.name,
          unitPrice: item.price,
          quantity: 1
        }))
      }

      await orderApi.createOrder(orderRequest)
    } catch (e) {
      // API失敗時はコンソールに警告を出すだけで、ユーザーへのエラー表示はしない
      // → ローカル記録は残っているので、ユーザー体験を損なわない
      console.warn('[CartContext] API order failed, order saved locally only.', e)
    }

    return true
  }

  // ── Provider で値を配布 ─────────────────────────────────────

  return (
    // CartContext.Provider の value に渡したオブジェクトが、
    // 子コンポーネントで useContext(CartContext) を呼んだときに取得できる
    <CartContext.Provider
      value={{
        cartItems,               // 現在のカートの中身
        cartCount: cartItems.length, // バッジ用のカウント数
        addToCart,               // 商品をカートへ追加
        removeFromCart,          // 商品をカートから削除
        resetCart,               // カートを空にする
        resetOrderHistory,       // 注文履歴をリセット
        orderHistory,            // 過去の注文履歴
        confirmOrder             // 注文を確定・送信する
      }}
    >
      {/* children: CartProvider で囲まれたすべての子コンポーネント */}
      {children}
    </CartContext.Provider>
  )
}
