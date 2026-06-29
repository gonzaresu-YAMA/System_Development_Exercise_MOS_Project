/**
 * MenuLayout.jsx — メニュー系ページ共通のレイアウトコンポーネント
 *
 * 「なぜ共通レイアウトを作るのか?」
 *   CategoryMenu・MenuPage・OrderConfirmPage・HistoryPage など
 *   多くのページが「ヘッダー + コンテンツ + フッター」の同じ構造を持つ。
 *   各ページに同じ HTML を書くのは重複なので、共通部分をここに集めた。
 *   各ページは children にページ固有のコンテンツだけ渡せばよい。
 *
 * 「何を表示するのか」
 *   - ヘッダー: 店名・滞在残り時間・注文履歴ボタン・無料備品ボタン・注文保留ボタン
 *   - フッター: ホーム（またはお会計）・注文送信・店員呼出しのナビゲーション
 *   - 時間切れオーバーレイ: 飲み放題の時間が切れたときに表示するダイアログ
 *
 * Props:
 *   activeTab:       現在のページのタブ名（フッターのハイライトと注文保留ボタンの判定に使う）
 *   children:        このレイアウトの中に表示するページ固有のコンテンツ
 *   showCheckout:    true のときフッターの「ホーム」を「お会計」ボタンに差し替える
 *   onCheckoutClick: お会計ボタンを押したときのコールバック関数
 */

import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CartContext } from '../contexts/CartContext'
import { getStayUntil, isNormalPlan } from '../utils/stayTimer'
import '../App.css'
import '../menu.css'

/**
 * メニュー系ページ共通のレイアウト
 *
 * @param {{
 *   activeTab: string,
 *   children: React.ReactNode,
 *   showCheckout?: boolean,
 *   onCheckoutClick?: () => void
 * }} props
 */
export function MenuLayout({ activeTab, children, showCheckout, onCheckoutClick }) {
  // CartContext からカート件数とリセット関数を取得
  const { cartCount, resetCart, resetOrderHistory } = useContext(CartContext)
  const navigate = useNavigate()
  const location = useLocation() // 現在の URL パスを取得する

  // 通常プランかどうかを確認（通常プランは時間制限なし）
  const unlimited = isNormalPlan()

  // 残り秒数の状態（初期値: Infinity = まだタイマー計算が始まっていない状態）
  const [remainingSeconds, setRemainingSeconds] = useState(Infinity)

  // ── 残り時間の表示文字列を計算する ────────────────────────
  // useMemo: 依存する値が変わったときだけ再計算する。毎回のレンダーで無駄に計算しない。
  const remainingLabel = useMemo(() => {
    // 通常プランまたはまだタイマーが始まっていない場合は表示しない
    if (unlimited || remainingSeconds === Infinity) return null

    if (remainingSeconds >= 60 * 60) {
      // 残り1時間以上のとき: 「1時間30分」形式で表示
      const h = Math.floor(remainingSeconds / 3600)          // 時間
      const m = Math.floor((remainingSeconds % 3600) / 60)   // 分
      // String(m).padStart(2, '0'): 1桁の分を「01」のように2桁に揃える
      return `${h}時間${String(m).padStart(2, '0')}分`
    }

    // 残り1時間未満のとき: 「05:30」形式（分:秒）でカウントダウン表示
    const m = Math.floor(remainingSeconds / 60)
    const s = remainingSeconds % 60 // % は余り演算子: 61秒 % 60 = 1秒
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [remainingSeconds, unlimited])
  // 依存配列: remainingSeconds か unlimited が変わったときだけ再計算する

  // ── 1秒ごとに残り時間を更新するタイマー ──────────────────
  useEffect(() => {
    if (unlimited) return // 通常プランならタイマー不要

    // タイマーの終了時刻を一度だけ取得（setInterval 内で毎回取得すると非効率）
    const until = getStayUntil()

    const update = () => {
      // 残り時間 = 終了時刻 - 現在時刻（ミリ秒 → 秒に変換）
      // Math.max(0, ...): 負の値にならないようにする
      setRemainingSeconds(Math.max(0, Math.ceil((until - Date.now()) / 1000)))
    }

    update() // マウント直後に一度すぐ実行（setInterval の最初の1秒を待たずに表示する）
    const id = setInterval(update, 1000) // その後は1秒ごとに更新

    return () => clearInterval(id) // クリーンアップ: コンポーネント破棄時にタイマーを止める
  }, [unlimited])

  // ── 戻るボタンの処理 ────────────────────────────────────
  const handleBack = () => {
    // 閲覧履歴が1件以下なら -1 で戻れないため、/menu に飛ばす
    if (window.history.length > 1) navigate(-1)
    else navigate('/menu')
  }

  // ── 時間切れ後のお会計処理 ──────────────────────────────
  const handleExpiredCheckout = () => {
    // 時間切れオーバーレイから会計へ遷移するときに
    // 未送信のカートと注文履歴をリセットしてから会計画面へ移動する
    resetCart()
    resetOrderHistory()
    navigate('/checkout')
  }

  // ── 表示判定のフラグ ────────────────────────────────────

  // メニュートップページ（/menu）以外のページで戻るボタンを表示する
  const showBackButton = location.pathname !== '/menu'

  // 飲み放題プランで残り時間が0になったかどうか
  const isExpired = !unlimited && remainingSeconds <= 0

  // 残り10分以下のとき、警告バナーを表示する
  const isExpiringSoon = !unlimited && remainingSeconds > 0 && remainingSeconds <= 10 * 60

  return (
    <div className="menu-screen">

      {/* ── ヘッダー ── */}
      <header className="menu-header">
        <div className="menu-header-top">
          {/* 戻るボタン: /menu ではない（サブページ）場合のみ表示 */}
          {showBackButton && (
            <button type="button" className="menu-header-back" onClick={handleBack}>
              ← 戻る
            </button>
          )}
          <div className="menu-header-title">居酒屋みどり亭</div>
        </div>

        <div className="menu-header-content">
          {/* 滞在残り時間の表示エリア */}
          <div className="remaining-time">
            {unlimited ? (
              // 通常プランの場合は「通常プラン」と表示
              <span style={{ color: 'var(--gold)', fontSize: '0.72rem', letterSpacing: '0.06em' }}>通常プラン</span>
            ) : (
              // 飲み放題プランの場合は残り時間をカウントダウン表示
              <>
                <span>滞在残り</span>
                <strong>{remainingLabel}</strong>
              </>
            )}
          </div>

          {/* ヘッダー右側のショートカットボタン群 */}
          <div className="menu-header-buttons">
            {/* 注文履歴ボタン */}
            <Link
              to="/history"
              className={`circle-button ${activeTab === 'history' ? 'is-active' : ''}`}
            >
              注文<br />履歴
            </Link>

            {/* 無料備品ボタン */}
            <Link
              to="/menu/c/free"
              className={`circle-button ${activeTab === 'free' ? 'is-active' : ''}`}
            >
              無料<br />備品
            </Link>

            {/*
              注文保留ボタン
              時間切れの場合: disabled のボタン（クリックできない）
              通常の場合: /order-confirm へのリンク
              ※ バッジ（件数）はどちらの場合も表示する
            */}
            {isExpired ? (
              <button type="button" className="circle-button badge-parent is-disabled" disabled>
                注文<br />保留
                <span className="badge">{cartCount}</span>
              </button>
            ) : (
              <Link
                to="/order-confirm"
                className={`circle-button badge-parent ${activeTab === 'hold' ? 'is-active' : ''}`}
              >
                注文<br />保留
                <span className="badge">{cartCount}</span>
              </Link>
            )}
          </div>
        </div>

        {/* 残り10分を切ったときに表示する警告バナー */}
        {/* role="status" aria-live="polite": スクリーンリーダーが内容の変化を通知する */}
        {isExpiringSoon && !isExpired && (
          <div className="stay-warning-banner" role="status" aria-live="polite">
            まもなく滞在時間が終了します。時間が0になると注文できなくなります。
          </div>
        )}
      </header>

      {/* ── ページ固有のコンテンツ ── */}
      {/* children: 各ページが <MenuLayout>...</MenuLayout> の中に書いたJSX */}
      <main className="menu-content">{children}</main>

      {/* ── フッターナビゲーション ── */}
      <footer className="menu-footer">
        {/*
          showCheckout=true のとき: 「お会計」ボタン（CategoryMenu で使用）
          showCheckout 未指定のとき: 「ホーム」リンク
        */}
        {showCheckout ? (
          <button
            type="button"
            className={`footer-button ${activeTab === 'categories' ? 'is-current' : ''} ${isExpired ? 'is-disabled' : ''}`}
            onClick={onCheckoutClick}
            disabled={isExpired}
          >
            お会計
          </button>
        ) : (
          <Link
            to="/menu"
            className={`footer-button ${activeTab === 'categories' ? 'is-current' : ''}`}
          >
            ホーム
          </Link>
        )}

        {/*
          注文送信ボタン
          時間切れの場合: 押せないボタン
          通常の場合: /order-send へのリンク
        */}
        {isExpired ? (
          <button
            type="button"
            className={`footer-button badge-parent ${activeTab === 'send' ? 'is-current' : ''} is-disabled`}
            disabled
          >
            注文送信
            <span className="badge">{cartCount}</span>
          </button>
        ) : (
          <Link
            to="/order-send"
            className={`footer-button badge-parent ${activeTab === 'send' ? 'is-current' : ''}`}
          >
            注文送信
            <span className="badge">{cartCount}</span>
          </Link>
        )}

        {/* 店員呼び出しボタン */}
        <Link
          to="/call-staff"
          className={`footer-button ${activeTab === 'call' ? 'is-current' : ''}`}
        >
          店員呼出し
        </Link>
      </footer>

      {/*
        時間切れオーバーレイ
        飲み放題の制限時間が0になったとき画面全体を覆うモーダルダイアログを表示する
        role="dialog" aria-modal="true": アクセシビリティ属性（スクリーンリーダー対応）
      */}
      {isExpired && (
        <div className="stay-expired-overlay" role="dialog" aria-modal="true">
          <div className="stay-expired-card">
            <p>
              滞在時間が終了しました。
              <br />
              お会計画面へ移動します。
            </p>
            <button type="button" className="stay-expired-action" onClick={handleExpiredCheckout}>
              お会計へ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
