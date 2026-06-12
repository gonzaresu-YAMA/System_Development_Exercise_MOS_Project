import { useNavigate, useParams } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import menuItems from '../data/menuItems'
import useStayRemaining from '../hooks/useStayRemaining'
import '../menu.css'

const categoryLabels = {
  free: '無料備品',
  yakitori: '焼き鳥',
  rice: 'ごはんもの',
  speed: 'スピード',
  drink: 'ドリンク',
  dessert: 'デザート'
}

export default function MenuPage() {
  const navigate = useNavigate()
  const { category } = useParams()
  const selectedCourse = sessionStorage.getItem('selectedCourse') || ''
  const isDrinkPlan = selectedCourse.startsWith('drink')
  const { isExpired } = useStayRemaining()

  const filtered = menuItems.filter((item) => item.category === category)
  const title = categoryLabels[category] || 'メニュー'

  const handleShowDetail = (item) => {
    navigate(`/menu/item/${item.id}`)
  }

  return (
    <MenuLayout activeTab={category === 'free' ? 'free' : ''}>
      <div className="category-title">{title}</div>

      {filtered.length === 0 ? (
        <div className="menu-empty">このカテゴリの商品はまだありません。</div>
      ) : (
        <div className="menu-grid">
          {filtered.map((item) => {
            const isDrinkItem = item.category === 'drink'
            const isDrinkExcluded = Boolean(item.drinkPlanExcluded)
            const shouldHidePrice = isDrinkPlan && isDrinkItem && !isDrinkExcluded

            return (
            <div
              key={item.id}
              className={`menu-card menu-card-${item.category} ${item.soldOut ? 'is-sold-out' : ''}`}
            >
              <div className="menu-image-area">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="menu-image" />
                ) : (
                  <div className="menu-image-placeholder" />
                )}
                {item.soldOut && <div className="sold-out-label">売り切れ</div>}
              </div>

              <div className="menu-card-body">
                <p className="menu-item-name">{item.name}</p>
                {isDrinkItem && isDrinkExcluded && (
                  <p className="drink-excluded-label">飲み放題対象外</p>
                )}
                <p className="menu-item-price">
                  {shouldHidePrice ? '' : `${item.price}￥`}
                </p>

                <button
                  type="button"
                  className="cart-button"
                  disabled={item.soldOut || isExpired}
                  onClick={() => handleShowDetail(item)}
                >
                  カートに入れる
                </button>
              </div>
            </div>
          )})}
        </div>
      )}
    </MenuLayout>
  )
}
