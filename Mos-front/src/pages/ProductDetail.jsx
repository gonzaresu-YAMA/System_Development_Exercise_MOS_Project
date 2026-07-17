/**
 * ProductDetail.jsx — 商品詳細ページ
 *
 * アクセス URL: /menu/item/:id
 *   例: /menu/item/9 → ID=9（ねぎま）の詳細ページ
 *
 * 役割:
 *   商品の画像・名前・価格を大きく表示し、
 *   数量を選択してカートに追加できる画面。
 *
 * 遷移の流れ:
 *   MenuPage の「カートに入れる」ボタン
 *     → /menu/item/:id（このページ）
 *       → 数量選択 → 「カートに追加」ボタン
 *         → /menu（メニューブックに戻る）
 */

import { useState, useContext, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { menuApi } from '../services/api'
import { resolveMenuImage } from '../data/menuImages'
import { CartContext } from '../contexts/CartContext'
import useStayRemaining from '../hooks/useStayRemaining'
import '../App.css'
import '../menu.css'

export default function ProductDetail() {
  // URL の :id パラメーターを取得する（文字列として返ってくる）
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useContext(CartContext)

  // 商品データ（バックエンドから取得）
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // id が変わるたびにバックエンドから最新の商品情報を取得する
  // → soldOut/価格などが常にDBの最新状態を反映する
  useEffect(() => {
    let cancelled = false

    async function fetchItem() {
      setLoading(true)
      setNotFound(false)
      try {
        const raw = await menuApi.getItemById(id)
        if (cancelled) return
        setItem({
          id: raw.id,
          name: raw.name,
          price: raw.price,
          soldOut: raw.soldOut,
          drinkPlanExcluded: raw.drinkPlanExcluded,
          category: raw.category?.name,
          image: resolveMenuImage(raw),
        })
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchItem()
    return () => { cancelled = true }
  }, [id])

  // コース情報の取得
  const selectedCourse = sessionStorage.getItem('selectedCourse') || ''
  const isDrinkPlan = selectedCourse.startsWith('drink')

  // 飲み放題プランの価格表示ロジック
  // ?. はオプショナルチェーン: item が undefined でもエラーにならない
  const isDrinkItem = item?.category === 'drink'
  const isDrinkExcluded = Boolean(item?.drinkPlanExcluded)
  const shouldHidePrice = isDrinkPlan && isDrinkItem && !isDrinkExcluded

  // 時間切れ判定
  const { isExpired } = useStayRemaining()

  // 数量の状態（最小値は1）
  const [qty, setQty] = useState(1)

  if (loading) {
    return (
      <div className="page-content">
        <p>読み込み中...</p>
      </div>
    )
  }

  // 商品が見つからない場合はエラーメッセージを表示する
  // ※ ルーティングで URL に存在しない ID が指定された場合
  if (notFound || !item) {
    return (
      <div className="page-content">
        <p>商品が見つかりません。</p>
      </div>
    )
  }

  /** 数量を1増やす */
  const inc = () => setQty((q) => q + 1)

  /** 数量を1減らす（1未満にはならない） */
  const dec = () => setQty((q) => (q > 1 ? q - 1 : 1))

  /**
   * カートに追加してメニューブックに戻る
   *
   * qty 個分の addToCart を呼ぶことで数量を実現する
   * （カートは1商品 = 1エントリーの設計のため）
   */
  const handleAdd = () => {
    if (isExpired) return // 時間切れなら何もしない

    for (let i = 0; i < qty; i++) {
      addToCart({
        id: item.id,
        name: item.name,
        // 飲み放題プランの対象ドリンクは 0 円でカートに追加する
        price: shouldHidePrice ? 0 : item.price,
        image: item.image
      })
    }

    // カート追加後は /menu に戻る（商品選択を続けられるように）
    navigate('/menu')
  }

  return (
    <div className="product-detail-screen">
      {/* ヘッダー（戻るボタンのみ）*/}
      <header className="product-detail-header">
        {/* navigate(-1): ブラウザの閲覧履歴を1つ戻る（前のページに戻る） */}
        <button type="button" className="product-detail-back" onClick={() => navigate(-1)}>
          ← 戻る
        </button>
      </header>

      <main className="product-detail-body">
        {/* 商品画像 */}
        <div className="product-detail-image">
          {item.image ? (
            <img src={item.image} alt={item.name} className="product-image" />
          ) : (
            // 画像がない場合はグレーのプレースホルダーを表示
            <div className="product-image-placeholder" />
          )}
        </div>

        {/* 商品情報・操作エリア */}
        <div className="product-detail-info">
          <div className="product-detail-row">
            <h2 className="product-detail-name">{item.name}</h2>
            <p className="product-detail-price">
              {shouldHidePrice
                ? '飲み放題'
                : item.price === 0
                ? '無料'
                : `¥${item.price}`}
            </p>
          </div>

          {/* 飲み放題対象外のラベル */}
          {isDrinkItem && isDrinkExcluded && (
            <p className="drink-excluded-label">飲み放題対象外</p>
          )}

          {/* 数量選択コントロール */}
          <div className="qty-controls">
            <button type="button" onClick={dec} className="qty-btn">−</button>
            <div className="qty-display">{qty}</div>
            <button type="button" onClick={inc} className="qty-btn">＋</button>
          </div>

          {/*
            カートに追加ボタン
            disabled 条件:
              isExpired  → 時間切れ後は注文不可
              item.soldOut → 売り切れ商品は注文不可
            売り切れの場合はボタンテキストも「売り切れ」に変える
          */}
          <button
            type="button"
            className="add-to-cart"
            onClick={handleAdd}
            disabled={isExpired || item.soldOut}
          >
            {item.soldOut ? '売り切れ' : `カートに追加（${qty}点）`}
          </button>
        </div>
      </main>
    </div>
  )
}
