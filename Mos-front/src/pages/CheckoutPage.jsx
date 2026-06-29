/**
 * CheckoutPage.jsx — お会計ページ
 *
 * アクセス URL: /checkout
 *
 * 役割:
 *   お会計の完了・来店お礼を表示する画面。
 *   カートと注文履歴をリセットすることで、次の来店に向けてセッションをクリアする。
 *
 * 「なぜ会計ページでカートをリセットするのか?」
 *   会計後にお客様が誤って注文を追加しないようにするため。
 *   また、次のお客様が同じ端末を使う場合に備えて状態をクリアする。
 *
 * 遷移経路:
 *   - 飲み放題の時間切れ → MenuLayout の時間切れオーバーレイから遷移
 *   - お会計ボタン（CategoryMenu）→ 確認モーダル → /checkout
 */

import { useContext, useEffect } from 'react'
import { CartContext } from '../contexts/CartContext'
import '../App.css'

export default function CheckoutPage() {
  const { cartItems, resetCart, resetOrderHistory } = useContext(CartContext)

  // ── マウント時（ページが表示されたとき）にカートをリセット ──
  useEffect(() => {
    // カートに商品が残っている場合（確認をスキップして直接遷移した場合など）
    // 念のためここでもリセットを実行する
    if (cartItems.length > 0) {
      resetCart()         // カートの中身を空にする
      resetOrderHistory() // 注文履歴をリセットする
    }
  }, [cartItems, resetCart, resetOrderHistory])
  // ※ cartItems が変わるたびにこの Effect が実行される設計だが、
  //   resetCart() を呼ぶと cartItems が空になり、条件 (> 0) が false になるため
  //   無限ループにはならない

  return (
    <div className="checkout-root">
      <div className="checkout-card">
        {/* お会計を示すアイコン（お猪口の絵文字） */}
        <span className="checkout-icon">🍶</span>

        <h2 className="checkout-title">お会計</h2>
        <p className="checkout-msg">
          本日はご来店いただきありがとうございました。
          <br />
          またのお越しをお待ちしております。
        </p>
        {/* ※ 実際の会計金額計算や決済機能は未実装。スタッフが別途対応する想定。 */}
      </div>
    </div>
  )
}
