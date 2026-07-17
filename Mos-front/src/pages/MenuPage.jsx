/**
 * MenuPage.jsx — カテゴリ別商品一覧ページ
 *
 * アクセス URL: /menu/c/:category
 *   例: /menu/c/yakitori → 焼き鳥一覧
 *       /menu/c/drink    → ドリンク一覧
 *
 * 役割:
 *   URL の :category パラメーターに一致する商品をグリッド形式で表示する。
 *   各商品には「カートに入れる」ボタンがあり、クリックすると商品詳細ページへ遷移する。
 *
 * 「CategoryMenu と MenuPage の違いは?」
 *   CategoryMenu (/menu) → メニューブック UI でカテゴリをページめくり形式で表示
 *   MenuPage (/menu/c/:category) → カード形式で商品一覧を表示する従来型 UI
 *   両方が共存しているのは開発過程で両方のビューを試したためと考えられる。
 */

import { useNavigate, useParams } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import { menuApi } from '../services/api'
import useStayRemaining from '../hooks/useStayRemaining'
import '../App.css'
import '../menu.css'
import { useEffect, useState } from 'react'

// カテゴリID → 表示名のマッピング
// URL パラメーターは英語（'yakitori'）なので、日本語の見出しに変換するために使う
const categoryLabels = {
  free:     '無料備品',
  yakitori: '焼き鳥',
  rice:     'ごはんもの',
  speed:    'スピード',
  drink:    'ドリンク',
  dessert:  'デザート'
}

export default function MenuPage() {
  const navigate = useNavigate()

  // useParams: URL の動的パラメーターを取得する
  // /menu/c/yakitori にアクセスすると { category: 'yakitori' } が返る
  const { category } = useParams()

  const [items,setItems] = useState([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState(null)

  // sessionStorage からコース選択情報を取得
  const selectedCourse = sessionStorage.getItem('selectedCourse') || ''
  const isDrinkPlan = selectedCourse.startsWith('drink') // 'drink-2h' または 'drink-3h'

  // 時間切れかどうかを取得（時間切れのときはカートに入れるボタンを無効化する）
  const { isExpired } = useStayRemaining()

  // カテゴリが変わる度にバックエンドから最新の商品情報を取得
  //    -> soldOut/stockはDBの最新状態を反映する
  useEffect(() => {
    let cancelled = false
    
    async function fetchItems(){
      setLoading(true)
      setError(null)
      try{
        const data = await menuApi.getItemsByCategory(category)
        if(!cancelled) setItems(data)
      }catch(e){
        if(!cancelled) setError(e)
      }finally{
        if(!cancelled) setLoading(false)
      }
    }

    fetchItems()
    return() => {cancelled = true}
  },[category])

  // カテゴリID を日本語の見出しに変換する
  // categoryLabels[category] が未定義の場合は '...' を表示
  const title = categoryLabels[category] || 'メニュー'

  return (
    // category === 'free' のとき、MenuLayout の activeTab を 'free' にする
    // → ヘッダーの「無料備品」ボタンがハイライトされる
    <MenuLayout activeTab={category === 'free' ? 'free' : ''}>

      {/* カテゴリ名の見出し */}
      <div className="category-title">{title}</div>

      {loading ? (
        <div className="menu-loading">読み込み中...</div>
      ):error?(
        <div className="menu-error">商品の読み込みに失敗しました</div>
      ):items.length === 0?(
        <div className="menu-empty">吾輩はヌルである。このカテゴリの商品はまだない。</div>
      ):(
        // {/* 商品が0件のとき空メッセージを表示する（条件付きレンダリング） */}
        // {filtered.length === 0 ? (
        // <div className="menu-empty">このカテゴリの商品はまだありません。</div>
        // ) : (

        // 商品カードのグリッドレイアウト
        <div className="menu-grid">
          {items.map((item)=>{
            // 飲み放題プランの価格表示ロジック
            const isDrinkItem = item.category?.name === 'drink' || category === 'drink'
            const isDrinkExcluded = Boolean(item.drinkPlanExcluded)
            // 飲み放題プラン かつ ドリンク商品 かつ 対象外フラグなし → 価格を隠す
            const shouldHidePrice = isDrinkPlan && isDrinkItem && !isDrinkExcluded

            // 在庫切れの判定:サーバ側のsoldOutフラグに加え、
            // stockが明示的いに0の場合も注文不可として扱う
            const isOutOfStock = item.soldOut || item.stock === 0
            const disabled = isOutOfStock || isExpired

            return (
              <div
                key={item.id}
                // 売り切れの場合は is-sold-out クラスを追加（CSS でグレーアウト等を適用）
                className={`menu-card ${isOutOfStock ? 'is-sold-out' :''}`}
              >
                {/* 商品画像エリア */}
                <div className="menu-image-area">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="menu-image"/>
                  ):(
                    // 画像がない場合はプレースホルダーを表示
                    <div className="menu-image-placeholder"/>
                  )}
                  {/* 売り切れの場合は「売り切れ」ラベルを画像に重ねて表示 */}
                  {isOutOfStock && <div className="sold-out-label">売り切れ</div>}
                </div>

                {/* 商品情報エリア */}
                <div className="menu-card-body">
                  <p className="menu-item-name">{item.name}</p>

                  {/* 飲み放題対象外の場合にラベルを表示 */}
                  {isDrinkItem && isDrinkExcluded && (
                    <p className="drink-excluded-label">飲み放題対象外</p>
                  )}

                  {/* 価格表示: 飲み放題 / 無料 / 通常価格 の3パターン */}
                  <p className="menu-item-price">
                    {shouldHidePrice ? '飲み放題' : item.price === 0 ? '無料' : `¥${item.price}`}
                  </p>

                  {/*
                    「カートに入れる」ボタン
                    クリックすると商品詳細ページへ遷移する
                    （詳細ページで数量を選んでカートに追加する設計）
                  */}
                  <button
                    type="button"
                    className="cart-button"
                    disabled={disabled}
                    onClick={() => navigate(`/menu/item/${item.id}`)}
                  >
                    {isOutOfStock ? '売り切れ' : 'カートに入れる'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </MenuLayout>
  )
}