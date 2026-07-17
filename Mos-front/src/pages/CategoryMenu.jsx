/**
 * CategoryMenu.jsx — メインメニューブック（カテゴリ別メニュー表示）
 *
 * アクセス URL: /menu
 *
 * 役割:
 *   居酒屋のメニュー帳をイメージした UI で、カテゴリごとのページをめくりながら
 *   商品を選んでカートに追加できるメインのメニュー画面。
 *
 * 主な機能:
 *   1. ページめくりアニメーション（カテゴリ間の切り替え）
 *   2. スワイプ操作でページを前後に移動
 *   3. 商品をタップするとボトムシート（下から出るパネル）で詳細・数量指定・カート追加
 *   4. Escape キーでボトムシートを閉じる
 *   5. お会計ボタン（カートに商品があれば確認モーダルを表示）
 *
 * 「なぜページめくりを自作しているのか?」
 *   CSS クラスを切り替えることで「exit（消える）→ enter（現れる）」の
 *   2ステップアニメーションを実現している。
 *   ライブラリを使わず自分で実装することで、デザインの自由度が高い。
 */

import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../contexts/CartContext'
import { menuApi } from '../services/api'
import { resolveMenuImage } from '../data/menuImages'
import useStayRemaining from '../hooks/useStayRemaining'
import '../App.css'
import '../menu.css'
import '../menubook.css'

// メニューを定期的に再取得する間隔（ミリ秒）
// 従業員側での売り切れ・在庫変更や新商品追加を、開きっぱなしの画面にも反映するため
const MENU_REFRESH_INTERVAL_MS = 30000

/**
 * バックエンドの MenuItem レスポンスをこの画面で使う形に変換する
 * category: ネストされた category オブジェクトから name（'yakitori' など）だけ取り出す
 * image: DB の imageUrl があればそれを、なければローカルのフォールバック画像を使う
 */
function mapMenuItem(raw) {
  return {
    id: raw.id,
    name: raw.name,
    price: raw.price,
    soldOut: raw.soldOut,
    drinkPlanExcluded: raw.drinkPlanExcluded,
    category: raw.category?.name,
    image: resolveMenuImage(raw),
  }
}

// ── アールデコ風の放射状装飾 SVG ─────────────────────────────
/**
 * メニューブックの上下に表示する装飾（放射状の線と幾何学模様）
 * @param {{ flip: boolean }} props - flip=true で上下反転する（下部装飾用）
 */
function SunburstDecor({ flip = false }) {
  // 21本の放射状の線を計算する
  // Array.from({ length: 21 }, (_, i) => ...) → 要素数21の配列を作りながらマッピング
  const lines = Array.from({ length: 21 }, (_, i) => {
    // 各線の角度を計算（中央の i=10 が真上、左右に 8.5度ずつ広がる）
    const angle = (-90 + (i - 10) * 8.5) * (Math.PI / 180) // 度 → ラジアン変換
    const cx = 200, cy = 130 // 中心座標
    const r0 = 20 // 内側の半径（線の始点）
    // 線の長さを交互に変えることで装飾らしいリズムを作る
    const r1 = 95 + (i % 3 === 0 ? 18 : i % 2 === 0 ? 10 : 0) // 外側の半径（線の終点）
    return {
      x1: cx + Math.cos(angle) * r0, y1: cy + Math.sin(angle) * r0, // 始点
      x2: cx + Math.cos(angle) * r1, y2: cy + Math.sin(angle) * r1  // 終点
    }
  })

  return (
    <svg viewBox="0 0 400 138" className="book-sunburst"
      style={{ transform: flip ? 'scaleY(-1)' : 'none' }} // flip=true で上下反転
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true"> {/* 装飾なのでスクリーンリーダーから隠す */}

      {/* 水平ベースライン */}
      <line x1="0" y1="130" x2="400" y2="130" stroke="#c8a055" strokeWidth="0.8" opacity="0.65"/>

      {/* 放射状の線 */}
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="#c8a055" strokeWidth="0.85" opacity="0.5"/>
      ))}

      {/* 半円弧（異なる半径で3本描いて重ねる） */}
      {[115, 95, 78].map(r => (
        <path key={r} d={`M${200-r} 130 A${r} ${r} 0 0 1 ${200+r} 130`}
          fill="none" stroke="#c8a055" strokeWidth="0.75" opacity="0.35"/>
      ))}

      {/* 中心の同心円 */}
      <circle cx="200" cy="130" r="16" fill="none" stroke="#c8a055" strokeWidth="0.9" opacity="0.65"/>
      <circle cx="200" cy="130" r="7"  fill="none" stroke="#c8a055" strokeWidth="0.9" opacity="0.5"/>

      {/* 中心の菱形マーク（上下） */}
      <polygon points="200,113 205.5,124 200,130 194.5,124"
        fill="none" stroke="#c8a055" strokeWidth="0.85" opacity="0.85"/>
      <polygon points="200,147 205.5,136 200,130 194.5,136"
        fill="none" stroke="#c8a055" strokeWidth="0.85" opacity="0.85"/>

      {/* 装飾ドット */}
      {[[-66,-26],[66,-26],[-42,-16],[42,-16]].map(([dx,dy],i) => (
        <circle key={i} cx={200+dx} cy={130+dy} r="1.8" fill="#c8a055" opacity="0.5"/>
      ))}
    </svg>
  )
}

// ── メインコンポーネント ──────────────────────────────────────
export default function CategoryMenu() {
  const { cartItems, addToCart, resetCart, resetOrderHistory } = useContext(CartContext)
  const { isExpired } = useStayRemaining()
  const navigate = useNavigate()

  // ── メニューデータ（バックエンドから取得）─────────────────────

  // categories: カテゴリ一覧（DB の categories テーブルから取得。sortOrder順）
  const [categories, setCategories] = useState([])

  // itemsByCategory: { カテゴリ名: 商品配列 } の形で保持する
  const [itemsByCategory, setItemsByCategory] = useState({})

  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError] = useState(null)

  // 初回マウント時にカテゴリ＋全カテゴリの商品を取得し、以後は定期的に再取得する
  // （従業員側の売り切れ・在庫・新商品追加を、開きっぱなしの画面にも反映するため）
  useEffect(() => {
    let cancelled = false

    async function fetchMenu() {
      try {
        const cats = await menuApi.getCategories()
        const mappedCats = cats.map((c) => ({ id: c.name, label: c.displayName }))

        // カテゴリごとの商品一覧を並行して取得する
        const itemLists = await Promise.all(
          mappedCats.map((c) => menuApi.getItemsByCategory(c.id))
        )
        if (cancelled) return

        const dict = {}
        mappedCats.forEach((c, i) => {
          dict[c.id] = itemLists[i].map(mapMenuItem)
        })

        setCategories(mappedCats)
        setItemsByCategory(dict)
        setMenuError(null)
      } catch (e) {
        if (!cancelled) setMenuError(e)
      } finally {
        if (!cancelled) setMenuLoading(false)
      }
    }

    fetchMenu()
    const interval = setInterval(fetchMenu, MENU_REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // ── ページめくりの状態 ──────────────────────────────────────

  // pageIndex: 「現在選択されているページ」のインデックス（即座に更新される）
  const [pageIndex, setPageIndex] = useState(0)

  // displayIndex: 「実際に画面に表示されているページ」のインデックス
  // ※ アニメーション中は pageIndex と displayIndex が一致しない
  //   (exit アニメーション中はまだ古い displayIndex を表示し、
  //    enter アニメーション開始直前に新しい displayIndex にセットする)
  const [displayIndex, setDisplayIndex] = useState(0)

  // flipPhase: アニメーションのフェーズ
  //   'idle'  → アニメーションなし（通常表示）
  //   'exit'  → 現在のページが消えるアニメーション（220ms）
  //   'enter' → 新しいページが現れるアニメーション（220ms）
  const [flipPhase, setFlipPhase] = useState('idle')

  // flipDir: アニメーションの方向
  //   'next' → 次のページへ（右から左）
  //   'prev' → 前のページへ（左から右）
  const [flipDir, setFlipDir] = useState('next')

  // flipLock: アニメーション中に重ねて操作されるのを防ぐロック
  // useRef を使う理由: ref の変更は再レンダーを引き起こさないため、
  //                   ロックのような「フラグ」管理に向いている
  const flipLock = useRef(false)

  // ── タッチ・スワイプ操作の状態 ────────────────────────────────
  // タッチ開始時の座標・時刻を記録する ref
  // 状態（useState）ではなく ref で持つ理由: 再レンダーが不要なため
  const touchRef = useRef({ x: null, y: null, t: null })

  // ── 商品ボトムシートの状態 ────────────────────────────────────

  // sheet: 選択中の商品（null のときボトムシートは非表示）
  const [sheet, setSheet] = useState(null)

  // qty: 数量選択の値
  const [qty, setQty] = useState(1)

  // addedFeedback: 「カートに追加しました」フィードバック表示中かどうか
  const [addedFeedback, setAddedFeedback] = useState(false)

  const sheetRef = useRef(null)          // ボトムシート DOM 要素への参照
  const sheetTouchY = useRef(null)       // ドラッグ下閉じ操作の開始 Y 座標

  // お会計確認モーダルの表示フラグ
  const [checkoutConfirm, setCheckoutConfirm] = useState(false)

  // 選択中のコースと飲み放題かどうかを sessionStorage から取得
  const selectedCourse = sessionStorage.getItem('selectedCourse') || ''
  const isDrinkPlan = selectedCourse.startsWith('drink')

  // ── ページめくり処理 ──────────────────────────────────────────

  /**
   * 指定インデックスのカテゴリページへ移動する
   *
   * useCallback: 依存配列 [pageIndex] が変わらない限り関数を再生成しない最適化
   *   → goTo をタッチイベントや DOM イベントに渡すとき、不要な再レンダーを防ぐ
   *
   * アニメーションの流れ:
   *   goTo(newIdx) 呼び出し
   *     → flipLock をかける
   *     → flipPhase = 'exit'（現在ページが消えるアニメーション開始）
   *     → 220ms 後: displayIndex を新しいページに更新、flipPhase = 'enter'（新ページが現れるアニメーション）
   *     → さらに 220ms 後: flipPhase = 'idle'、flipLock 解除
   *
   * @param {number} newIdx - 移動先カテゴリのインデックス
   */
  const goTo = useCallback((newIdx) => {
    if (flipLock.current) return                         // アニメーション中なら無視
    if (newIdx < 0 || newIdx >= categories.length) return // 範囲外なら無視
    if (newIdx === pageIndex) return                     // 同じページなら無視

    flipLock.current = true
    const dir = newIdx > pageIndex ? 'next' : 'prev'    // 移動方向を判定
    setFlipDir(dir)
    setFlipPhase('exit') // exit アニメーション開始

    setTimeout(() => {
      setDisplayIndex(newIdx) // 表示するコンテンツを新ページに切り替え
      setPageIndex(newIdx)
      setFlipPhase('enter')  // enter アニメーション開始

      setTimeout(() => {
        setFlipPhase('idle') // アニメーション完了
        flipLock.current = false // ロック解除
      }, 220)
    }, 220) // exit アニメーション時間と同じ（CSS animation-duration と合わせる）
  }, [pageIndex, categories.length])

  // ── タッチ・スワイプ操作 ──────────────────────────────────────

  /** タッチ開始時に座標と時刻を記録する */
  const onTouchStart = (e) => {
    if (sheet) return // ボトムシートが開いている場合はスワイプ操作を無視
    touchRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      t: Date.now()
    }
  }

  /** タッチ終了時にスワイプかどうかを判定する */
  const onTouchEnd = (e) => {
    if (sheet) return
    const { x, y, t } = touchRef.current
    if (x === null) return

    const dx = x - e.changedTouches[0].clientX  // 横方向の移動量（正=左スワイプ）
    const dy = Math.abs(y - e.changedTouches[0].clientY) // 縦方向の移動量（絶対値）
    const dt = Date.now() - t                    // スワイプにかかった時間

    // スワイプ判定条件:
    //   dy < |dx| * 0.7 → 縦方向より横方向の動きが大きい（スクロールでなくスワイプ）
    //   dt < 400       → 400ms 以内の素早い動き
    //   |dx| > 44      → 最低44px以上の横移動
    if (dy < Math.abs(dx) * 0.7 && dt < 400 && Math.abs(dx) > 44) {
      dx > 0 ? goTo(pageIndex + 1) : goTo(pageIndex - 1)
      // dx > 0 → 左スワイプ → 次のページ
      // dx < 0 → 右スワイプ → 前のページ
    }
    touchRef.current = { x: null, y: null, t: null } // リセット
  }

  // ── 商品ボトムシート ──────────────────────────────────────────

  /** 商品をタップしてボトムシートを開く */
  const openSheet = (item) => {
    // 売り切れまたは時間切れの商品はボトムシートを開かない
    if (item.soldOut || isExpired) return
    setSheet(item)
    setQty(1)              // 数量を1にリセット
    setAddedFeedback(false)// フィードバック表示をリセット
  }

  /** ボトムシートを閉じる */
  const closeSheet = () => {
    setSheet(null)
    setAddedFeedback(false)
  }

  /**
   * カートに商品を追加する
   *
   * 飲み放題プランのドリンク（drinkPlanExcluded でないもの）は
   * 価格を 0 円としてカートに追加する（飲み放題なので料金計算から除外）
   * qty の数だけ繰り返し addToCart を呼ぶことで数量を実現している
   * （カートでは 1商品=1エントリーの設計なので、qty=3 なら3回追加する）
   */
  const handleAddToCart = () => {
    if (!sheet || isExpired) return
    const shouldHidePrice = isDrinkPlan && sheet.category === 'drink' && !sheet.drinkPlanExcluded
    for (let i = 0; i < qty; i++) {
      addToCart({
        id: sheet.id,
        name: sheet.name,
        price: shouldHidePrice ? 0 : sheet.price,
        image: sheet.image
      })
    }
    setAddedFeedback(true)              // 「追加済み」フィードバックを表示
    setTimeout(() => closeSheet(), 800) // 800ms 後にシートを自動で閉じる
  }

  // ドラッグして下げるとシートが閉じる操作
  const onSheetTouchStart = (e) => { sheetTouchY.current = e.touches[0].clientY }
  const onSheetTouchEnd = (e) => {
    if (sheetTouchY.current === null) return
    // 下方向に 60px 以上ドラッグしたらシートを閉じる
    if (e.changedTouches[0].clientY - sheetTouchY.current > 60) closeSheet()
    sheetTouchY.current = null
  }

  // Escape キーでシートを閉じる
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeSheet() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey) // クリーンアップ
  }, [])

  // ── お会計処理 ────────────────────────────────────────────────

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      // カートに商品が入っているなら確認モーダルを表示する
      // （注文を送らずに会計してよいか確認するため）
      setCheckoutConfirm(true)
      return
    }
    // カートが空なら直接お会計画面へ
    resetCart()
    resetOrderHistory()
    navigate('/checkout')
  }

  // ── レンダー用の計算 ─────────────────────────────────────────

  // カテゴリ取得前・取得失敗時は、めくれるページが無いので専用の画面を出す
  if (menuLoading || categories.length === 0) {
    return (
      <MenuLayout activeTab="categories">
        <div className="menu-loading">
          {menuError ? 'メニューの読み込みに失敗しました' : '読み込み中...'}
        </div>
      </MenuLayout>
    )
  }

  // 現在表示中のカテゴリ情報と、そのカテゴリに属する商品リスト
  const cat = categories[displayIndex] || categories[0]
  const items = itemsByCategory[cat.id] || []

  // ページめくりアニメーション用の CSS クラス名を計算
  // 例: flipPhase='exit', flipDir='next' → 'flip-next-exit'
  const flipClass = flipPhase === 'idle' ? ''
    : flipPhase === 'exit'  ? `flip-${flipDir}-exit`
    : `flip-${flipDir}-enter`

  return (
    <MenuLayout activeTab="categories" showCheckout onCheckoutClick={handleCheckout}>

      {/* ── メニューブック本体 ──────────────────────────────── */}
      <div
        className={`menu-book ${flipClass}`} // アニメーション CSS クラスを付与
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 上部の装飾 */}
        <div className="book-decor-top"><SunburstDecor /></div>

        {/* レストラン名 */}
        <div className="book-restaurant-name">
          <span className="book-name-en">IZAKAYA MIDORI-TEI</span>
          <h2 className="book-name-ja">居酒屋みどり亭</h2>
        </div>

        {/* カテゴリ名ヘッダー */}
        <div className="book-category-header">
          <span className="book-category-label">{cat.label}</span>
        </div>

        {/* 商品リスト */}
        <ul className="book-item-list">
          {items.map((item) => {
            // 飲み放題プランの価格表示ロジック:
            //   isDrinkPlan かつ ドリンクカテゴリ かつ 対象外でない → 「飲み放題」と表示
            const isDrinkItem = item.category === 'drink'
            const isDrinkExcluded = Boolean(item.drinkPlanExcluded)
            const inPlan = isDrinkPlan && isDrinkItem && !isDrinkExcluded
            const isFree = item.price === 0
            const priceLabel = inPlan ? '飲み放題' : isFree ? '無料' : `¥${item.price.toLocaleString()}`
            // toLocaleString(): 数値を「1,234」のようにカンマ区切りで表示する

            return (
              <li
                key={item.id}
                className={`book-item${item.soldOut ? ' is-sold-out' : ''}`}
                onClick={() => openSheet(item)}
                role="button"      // <li> を「ボタンとして使える要素」とスクリーンリーダーに伝える
                tabIndex={0}       // キーボードのフォーカス移動（Tab キー）を可能にする
                onKeyDown={(e) => e.key === 'Enter' && openSheet(item)} // Enter キーで開く
              >
                <div className="book-item-left">
                  <span className="book-item-name">{item.name}</span>
                  {/* 飲み放題対象外バッジ */}
                  {isDrinkItem && isDrinkExcluded && (
                    <span className="book-item-tag">飲み放題対象外</span>
                  )}
                  {/* 売り切れバッジ */}
                  {item.soldOut && <span className="book-item-tag sold-out">売り切れ</span>}
                </div>
                <div className="book-item-dots" aria-hidden="true" /> {/* 点線（装飾） */}
                <span className="book-item-price">{priceLabel}</span>
              </li>
            )
          })}
        </ul>

        {/* 下部の装飾（上下反転） */}
        <div className="book-decor-bottom"><SunburstDecor flip /></div>
      </div>

      {/* ── ページナビゲーション（矢印 + ドット）────────────── */}
      <div className="book-nav">
        <button className="book-nav-arrow" type="button"
          onClick={() => goTo(pageIndex - 1)}
          disabled={pageIndex === 0}  // 最初のページでは「前へ」を無効化
          aria-label="前のページ">
          ‹
        </button>

        <div className="book-nav-dots">
          {categories.map((c, i) => (
            <button key={c.id} type="button"
              className={`book-nav-dot${i === pageIndex ? ' is-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={c.label}
            />
          ))}
        </div>

        <button className="book-nav-arrow" type="button"
          onClick={() => goTo(pageIndex + 1)}
          disabled={pageIndex === categories.length - 1} // 最後のページでは「次へ」を無効化
          aria-label="次のページ">
          ›
        </button>
      </div>

      {/* スワイプ操作のヒント文 */}
      <p className="book-swipe-hint">← スワイプでページをめくる →</p>

      {/* ── 商品ボトムシート ────────────────────────────────── */}
      {/* sheet に商品が入っているときだけ表示する */}
      {sheet && (
        <>
          {/* 背景のオーバーレイ（クリックでシートを閉じる） */}
          <div className="sheet-backdrop" onClick={closeSheet} aria-hidden="true" />

          {/* シート本体 */}
          <div
            className="item-sheet"
            ref={sheetRef}
            role="dialog"       // ダイアログとしてスクリーンリーダーに伝える
            aria-modal="true"
            aria-label={sheet.name}
            onTouchStart={onSheetTouchStart}
            onTouchEnd={onSheetTouchEnd}
          >
            {/* ドラッグハンドル（シートを引っ張る目印の横線） */}
            <div className="sheet-handle" aria-hidden="true" />

            {/* 商品画像 */}
            {sheet.image && (
              <div className="sheet-image-wrap">
                <img src={sheet.image} alt={sheet.name} className="sheet-image" />
              </div>
            )}

            {/* 商品情報 */}
            <div className="sheet-info">
              <h3 className="sheet-item-name">{sheet.name}</h3>
              {sheet.category === 'drink' && sheet.drinkPlanExcluded && (
                <p className="sheet-tag">飲み放題対象外</p>
              )}
              <p className="sheet-price">
                {isDrinkPlan && sheet.category === 'drink' && !sheet.drinkPlanExcluded
                  ? '飲み放題'
                  : sheet.price === 0 ? '無料'
                  : `¥${sheet.price.toLocaleString()}`}
              </p>
            </div>

            {/* 数量選択 */}
            <div className="sheet-qty-row">
              {/* − ボタン: 1より小さくならないように Math.max で制限 */}
              <button type="button" className="sheet-qty-btn"
                onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="減らす">
                −
              </button>
              <span className="sheet-qty-val">{qty}</span>
              <button type="button" className="sheet-qty-btn"
                onClick={() => setQty(q => q + 1)} aria-label="増やす">
                ＋
              </button>
            </div>

            {/* カートに追加ボタン */}
            {/* addedFeedback=true のとき「追加済み」表示に切り替わり、disabled になる */}
            <button
              type="button"
              className={`sheet-add-btn${addedFeedback ? ' is-added' : ''}`}
              onClick={handleAddToCart}
              disabled={addedFeedback}
            >
              {addedFeedback ? '✓ カートに追加しました' : `カートに追加（${qty}点）`}
            </button>

            <button type="button" className="sheet-close-btn" onClick={closeSheet}>
              とじる
            </button>
          </div>
        </>
      )}

      {/* ── お会計確認モーダル ──────────────────────────────── */}
      {/* カートに商品が残っている状態でお会計しようとしたとき表示 */}
      {checkoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p>注文保留に未確定の商品があります。<br />注文をせずに会計しますか？</p>
            <div className="modal-actions">
              <button type="button" className="modal-button" onClick={() => {
                setCheckoutConfirm(false)
                resetCart()
                resetOrderHistory()
                navigate('/checkout')
              }}>はい</button>
              <button type="button" className="modal-button is-dark"
                onClick={() => setCheckoutConfirm(false)}>いいえ</button>
            </div>
          </div>
        </div>
      )}
    </MenuLayout>
  )
}
