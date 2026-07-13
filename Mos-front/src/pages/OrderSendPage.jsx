/**
 * OrderSendPage.jsx — 注文送信ページ（最終確認 + 送信）
 *
 * アクセス URL: /order-send
 *
 * 役割:
 *   注文の最終確認モーダルを表示し、「送信する」で注文を確定・送信する。
 *   重複注文の防止チェックも行う。
 *
 * 画面の状態遷移:
 *   [通常時] → 「注文を確定して送信しますか？」モーダル表示
 *     → 送信する → [重複チェック]
 *       → 重複なし: confirmOrder() 実行 → 「ご注文を承りました」Toast → 2.3秒後に /menu へ
 *       → 重複あり: 「重複の可能性があります」警告モーダル → 「続行する」でそのまま送信
 *   → キャンセル → /menu へ戻る
 *
 * 重複チェックの仕組み:
 *   1. 注文履歴の直近5件と現在のカートの内容を「商品名:数量」の文字列（シグネチャ）で比較
 *   2. 1秒以内に同じ操作が行われた場合（連打防止）
 *   いずれかに該当したら警告を表示する（ただしユーザーが続行を選べる）
 */

import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../contexts/CartContext'
import useStayRemaining from '../hooks/useStayRemaining'
import '../App.css'
import '../menu.css'

export default function OrderSendPage() {
  const { cartItems, confirmOrder, orderHistory, lastCustomerId } = useContext(CartContext)
  const navigate = useNavigate()

  // isSent: 注文が送信完了したかどうか（true のとき「承りました」Toast を表示）
  const [isSent, setIsSent] = useState(false)

  // warningType: 表示する警告の種類
  //   null     → 警告なし（通常）
  //   'history'→ 過去の注文と重複している警告
  //   'rapid'  → 1秒以内の連打が検出された警告
  const [warningType, setWarningType] = useState(null)

  // pendingConfirm: 警告モーダルで「続行する」を押したあとに実際の注文処理を行うフラグ
  const [pendingConfirm, setPendingConfirm] = useState(false)

  const { isExpired } = useStayRemaining()

  // ── カートが空になったらメニューに戻す ────────────────────────
  // 例: 別タブでカートがリセットされたとき、またはカートが元から空のとき
  useEffect(() => {
    if (cartItems.length === 0 && !isSent) navigate('/menu')
  }, [cartItems, isSent, navigate])

  // ── 注文送信後、一定時間後にメニューへ自動遷移 ─────────────────
  // 客番号が表示される場合は、お客様が番号を控える時間を確保するため長めにする
  useEffect(() => {
    if (!isSent) return
    const delay = lastCustomerId ? 6000 : 2300
    // setTimeout: 指定ミリ秒後に一度だけ関数を実行する
    const id = setTimeout(() => navigate('/menu'), delay)
    // クリーンアップ: コンポーネントが破棄された場合はタイマーを止める
    return () => clearTimeout(id)
  }, [isSent, navigate, lastCustomerId])

  // ── カートが空になったら警告もリセット ───────────────────────
  useEffect(() => {
    if (cartItems.length === 0) {
      setWarningType(null)
      setPendingConfirm(false)
    }
  }, [cartItems])

  /**
   * 実際に注文を確定・送信する処理
   * confirmOrder() は CartContext が提供する関数
   */
  const proceedConfirm = async () => {
    const didConfirm = await confirmOrder()
    if (!didConfirm) {
      // confirmOrder が false を返した場合（時間切れ、カートが空など）はメニューに戻る
      navigate('/menu')
      return
    }
    setIsSent(true) // 送信完了 → Toast 表示 → 2.3秒後に自動でメニューへ
  }

  /**
   * 警告モーダルで「続行する」を押したときの処理
   * 警告を閉じて pendingConfirm フラグが立っていたら注文処理を実行する
   */
  const handleWarningContinue = () => {
    setWarningType(null)
    if (pendingConfirm) {
      setPendingConfirm(false)
      // lastOrderAttemptAt: 最後に注文を試みた時刻を更新（連打チェック用）
      sessionStorage.setItem('lastOrderAttemptAt', String(Date.now()))
      proceedConfirm()
    }
  }

  /**
   * 「送信する」ボタンが押されたときの処理
   *
   * 重複チェック → 問題なければ注文送信、問題あれば警告表示
   */
  const handleConfirm = () => {
    // 時間切れまたはカートが空なら何もせずメニューに戻る
    if (isExpired || cartItems.length === 0) {
      navigate('/menu')
      return
    }

    /**
     * 注文内容を比較するためのシグネチャ文字列を作る関数
     *
     * 例: カートに「ねぎま×2, もも×1」があれば "もも:1|ねぎま:2" という文字列になる
     * （名前でソートすることで順番が違っても同じシグネチャになる）
     *
     * @param {Array<{name: string}>} items
     * @returns {string} "商品名:数量|商品名:数量" 形式の文字列
     */
    const buildSig = (items) =>
      Object.entries(
        // まず商品名ごとの個数を集計する（reduce で { ねぎま: 2, もも: 1 } 形式に）
        items.reduce((acc, i) => {
          acc[i.name] = (acc[i.name] || 0) + 1
          return acc
        }, {})
      )
      .sort(([a], [b]) => a.localeCompare(b)) // 商品名でソート（比較を順序非依存にする）
      .map(([n, q]) => `${n}:${q}`)           // "商品名:数量" 形式に変換
      .join('|')                              // | で結合して1つの文字列にする

    const currentSig = buildSig(cartItems)

    // 過去5件以内に同じ注文がないかチェック
    const hasDuplicate = orderHistory.slice(0, 5).some((o) => buildSig(o.items) === currentSig)

    // 最後に注文を試みた時刻から1秒以内かどうかチェック（連打防止）
    const lastAttempt = Number(sessionStorage.getItem('lastOrderAttemptAt'))
    const hasRapid = Boolean(lastAttempt && Date.now() - lastAttempt < 1000)

    if (hasDuplicate || hasRapid) {
      // どちらかに該当したら警告を表示する
      // hasRapid を優先（より緊急な問題のため）
      setWarningType(hasRapid ? 'rapid' : 'history')
      setPendingConfirm(true) // 警告を無視して続行した場合に送信するためのフラグ
      return
    }

    // 重複なし → 注文時刻を記録して送信
    sessionStorage.setItem('lastOrderAttemptAt', String(Date.now()))
    proceedConfirm()
  }

  return (
    <MenuLayout activeTab="send">

      {/* 通常の送信確認モーダル */}
      {!isSent && !warningType && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p>注文を確定して送信しますか？</p>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-button"
                onClick={handleConfirm}
                disabled={cartItems.length === 0 || isExpired}
              >
                送信する
              </button>
              {/* キャンセルはリンクで /menu へ戻る */}
              <Link to="/menu" className="modal-button is-dark">キャンセル</Link>
            </div>
          </div>
        </div>
      )}

      {/* 重複警告モーダル */}
      {warningType && !isSent && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p>
              注文が重複している可能性があります。
              {/* 警告の種類によってメッセージを切り替える */}
              {warningType === 'history' && <><br />過去5件以内に同じ注文があります。</>}
              {warningType === 'rapid'   && <><br />1秒以内に同じ操作が行われています。</>}
              <br />続行しますか？
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-button" onClick={handleWarningContinue}>
                続行する
              </button>
              <Link
                to="/menu"
                className="modal-button is-dark"
                onClick={() => { setWarningType(null); setPendingConfirm(false) }}
              >
                キャンセル
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 注文完了 Toast（送信成功後に表示） */}
      {/* role="status" aria-live="polite": スクリーンリーダーがこの内容を読み上げる */}
      {isSent && (
        <div className="toast-overlay" role="status" aria-live="polite">
          <div className="toast-card">
            ご注文を承りました
            {/* 客番号: お会計時にレジで伝えていただく7桁の番号 */}
            {lastCustomerId && (
              <>
                <br />
                <span className="toast-customer-label">お会計番号</span>
                <br />
                <span className="toast-customer-id">{lastCustomerId}</span>
              </>
            )}
            <br />
            メニュー画面へ戻ります
          </div>
        </div>
      )}
    </MenuLayout>
  )
}
