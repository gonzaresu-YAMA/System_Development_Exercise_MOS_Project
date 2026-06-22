import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import { CartContext } from '../contexts/CartContext'
import menuItems from '../data/menuItems'
import useStayRemaining from '../hooks/useStayRemaining'
import '../App.css'
import '../menu.css'
import '../menubook.css'

const categories = [
  { id: 'yakitori', label: '焼き鳥'     },
  { id: 'speed',    label: 'スピード'   },
  { id: 'rice',     label: 'ごはんもの' },
  { id: 'drink',    label: 'ドリンク'   },
  { id: 'dessert',  label: 'デザート'   },
  { id: 'free',     label: '無料備品'   }
]

// ── Art Deco Sunburst SVG ─────────────────────────────────
function SunburstDecor({ flip = false }) {
  const lines = Array.from({ length: 21 }, (_, i) => {
    const angle = (-90 + (i - 10) * 8.5) * (Math.PI / 180)
    const cx = 200, cy = 130
    const r0 = 20
    const r1 = 95 + (i % 3 === 0 ? 18 : i % 2 === 0 ? 10 : 0)
    return { x1: cx + Math.cos(angle)*r0, y1: cy + Math.sin(angle)*r0,
             x2: cx + Math.cos(angle)*r1, y2: cy + Math.sin(angle)*r1 }
  })
  return (
    <svg viewBox="0 0 400 138" className="book-sunburst"
      style={{ transform: flip ? 'scaleY(-1)' : 'none' }}
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="0" y1="130" x2="400" y2="130" stroke="#c8a055" strokeWidth="0.8" opacity="0.65"/>
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="#c8a055" strokeWidth="0.85" opacity="0.5"/>
      ))}
      {[115, 95, 78].map(r => (
        <path key={r} d={`M${200-r} 130 A${r} ${r} 0 0 1 ${200+r} 130`}
          fill="none" stroke="#c8a055" strokeWidth="0.75" opacity="0.35"/>
      ))}
      <circle cx="200" cy="130" r="16" fill="none" stroke="#c8a055" strokeWidth="0.9" opacity="0.65"/>
      <circle cx="200" cy="130" r="7"  fill="none" stroke="#c8a055" strokeWidth="0.9" opacity="0.5"/>
      <polygon points="200,113 205.5,124 200,130 194.5,124"
        fill="none" stroke="#c8a055" strokeWidth="0.85" opacity="0.85"/>
      <polygon points="200,147 205.5,136 200,130 194.5,136"
        fill="none" stroke="#c8a055" strokeWidth="0.85" opacity="0.85"/>
      {[[-66,-26],[66,-26],[-42,-16],[42,-16]].map(([dx,dy],i) => (
        <circle key={i} cx={200+dx} cy={130+dy} r="1.8" fill="#c8a055" opacity="0.5"/>
      ))}
    </svg>
  )
}

// ── Main Component ────────────────────────────────────────
export default function CategoryMenu() {
  const { cartItems, addToCart, resetCart, resetOrderHistory } = useContext(CartContext)
  const { isExpired } = useStayRemaining()
  const navigate = useNavigate()

  // Page flip state
  const [pageIndex, setPageIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [flipPhase, setFlipPhase] = useState('idle')   // idle | exit | enter
  const [flipDir, setFlipDir] = useState('next')       // next | prev
  const flipLock = useRef(false)

  // Touch / swipe
  const touchRef = useRef({ x: null, y: null, t: null })

  // Bottom sheet (product detail)
  const [sheet, setSheet] = useState(null)   // selected MenuItem | null
  const [qty, setQty] = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const sheetRef = useRef(null)
  const sheetTouchY = useRef(null)

  // Checkout confirm
  const [checkoutConfirm, setCheckoutConfirm] = useState(false)

  const selectedCourse = sessionStorage.getItem('selectedCourse') || ''
  const isDrinkPlan = selectedCourse.startsWith('drink')

  // ── Page flip ──────────────────────────────────────────
  const goTo = useCallback((newIdx) => {
    if (flipLock.current) return
    if (newIdx < 0 || newIdx >= categories.length) return
    if (newIdx === pageIndex) return

    flipLock.current = true
    const dir = newIdx > pageIndex ? 'next' : 'prev'
    setFlipDir(dir)
    setFlipPhase('exit')

    setTimeout(() => {
      setDisplayIndex(newIdx)
      setPageIndex(newIdx)
      setFlipPhase('enter')
      setTimeout(() => {
        setFlipPhase('idle')
        flipLock.current = false
      }, 220)
    }, 220)
  }, [pageIndex])

  // ── Touch swipe ────────────────────────────────────────
  const onTouchStart = (e) => {
    if (sheet) return
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
  }

  const onTouchEnd = (e) => {
    if (sheet) return
    const { x, y, t } = touchRef.current
    if (x === null) return
    const dx = x - e.changedTouches[0].clientX
    const dy = Math.abs(y - e.changedTouches[0].clientY)
    const dt = Date.now() - t
    if (dy < Math.abs(dx) * 0.7 && dt < 400 && Math.abs(dx) > 44) {
      dx > 0 ? goTo(pageIndex + 1) : goTo(pageIndex - 1)
    }
    touchRef.current = { x: null, y: null, t: null }
  }

  // ── Product sheet ──────────────────────────────────────
  const openSheet = (item) => {
    if (item.soldOut || isExpired) return
    setSheet(item)
    setQty(1)
    setAddedFeedback(false)
  }

  const closeSheet = () => {
    setSheet(null)
    setAddedFeedback(false)
  }

  const handleAddToCart = () => {
    if (!sheet || isExpired) return
    const shouldHidePrice = isDrinkPlan && sheet.category === 'drink' && !sheet.drinkPlanExcluded
    for (let i = 0; i < qty; i++) {
      addToCart({ id: sheet.id, name: sheet.name, price: shouldHidePrice ? 0 : sheet.price, image: sheet.image })
    }
    setAddedFeedback(true)
    setTimeout(() => closeSheet(), 800)
  }

  // Drag-down sheet dismiss
  const onSheetTouchStart = (e) => { sheetTouchY.current = e.touches[0].clientY }
  const onSheetTouchEnd = (e) => {
    if (sheetTouchY.current === null) return
    if (e.changedTouches[0].clientY - sheetTouchY.current > 60) closeSheet()
    sheetTouchY.current = null
  }

  // Close sheet with Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeSheet() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Checkout ───────────────────────────────────────────
  const handleCheckout = () => {
    if (cartItems.length > 0) { setCheckoutConfirm(true); return }
    resetCart(); resetOrderHistory(); navigate('/checkout')
  }

  // ── Render page content ────────────────────────────────
  const cat = categories[displayIndex]
  const items = menuItems.filter((m) => m.category === cat.id)

  const flipClass = flipPhase === 'idle' ? ''
    : flipPhase === 'exit'  ? `flip-${flipDir}-exit`
    : `flip-${flipDir}-enter`

  return (
    <MenuLayout activeTab="categories" showCheckout onCheckoutClick={handleCheckout}>

      {/* ── Menu Book ─────────────────────────────────── */}
      <div
        className={`menu-book ${flipClass}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="book-decor-top"><SunburstDecor /></div>

        <div className="book-restaurant-name">
          <span className="book-name-en">IZAKAYA MIDORI-TEI</span>
          <h2 className="book-name-ja">居酒屋みどり亭</h2>
        </div>

        <div className="book-category-header">
          <span className="book-category-label">{cat.label}</span>
        </div>

        <ul className="book-item-list">
          {items.map((item) => {
            const isDrinkItem = item.category === 'drink'
            const isDrinkExcluded = Boolean(item.drinkPlanExcluded)
            const inPlan = isDrinkPlan && isDrinkItem && !isDrinkExcluded
            const isFree  = item.price === 0
            const priceLabel = inPlan ? '飲み放題' : isFree ? '無料' : `¥${item.price.toLocaleString()}`

            return (
              <li
                key={item.id}
                className={`book-item${item.soldOut ? ' is-sold-out' : ''}`}
                onClick={() => openSheet(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openSheet(item)}
              >
                <div className="book-item-left">
                  <span className="book-item-name">{item.name}</span>
                  {isDrinkItem && isDrinkExcluded && (
                    <span className="book-item-tag">飲み放題対象外</span>
                  )}
                  {item.soldOut && <span className="book-item-tag sold-out">売り切れ</span>}
                </div>
                <div className="book-item-dots" aria-hidden="true" />
                <span className="book-item-price">{priceLabel}</span>
              </li>
            )
          })}
        </ul>

        <div className="book-decor-bottom"><SunburstDecor flip /></div>
      </div>

      {/* ── Page navigation ───────────────────────────── */}
      <div className="book-nav">
        <button className="book-nav-arrow" type="button"
          onClick={() => goTo(pageIndex - 1)} disabled={pageIndex === 0} aria-label="前のページ">
          ‹
        </button>
        <div className="book-nav-dots">
          {categories.map((c, i) => (
            <button key={c.id} type="button"
              className={`book-nav-dot${i === pageIndex ? ' is-active' : ''}`}
              onClick={() => goTo(i)} aria-label={c.label} />
          ))}
        </div>
        <button className="book-nav-arrow" type="button"
          onClick={() => goTo(pageIndex + 1)} disabled={pageIndex === categories.length - 1} aria-label="次のページ">
          ›
        </button>
      </div>

      <p className="book-swipe-hint">← スワイプでページをめくる →</p>

      {/* ── Product bottom sheet ──────────────────────── */}
      {sheet && (
        <>
          <div className="sheet-backdrop" onClick={closeSheet} aria-hidden="true" />
          <div
            className="item-sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={sheet.name}
            onTouchStart={onSheetTouchStart}
            onTouchEnd={onSheetTouchEnd}
          >
            {/* Drag handle */}
            <div className="sheet-handle" aria-hidden="true" />

            {/* Image */}
            {sheet.image && (
              <div className="sheet-image-wrap">
                <img src={sheet.image} alt={sheet.name} className="sheet-image" />
              </div>
            )}

            {/* Info */}
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

            {/* Quantity */}
            <div className="sheet-qty-row">
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

            {/* Add to cart */}
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

      {/* ── Checkout confirm ──────────────────────────── */}
      {checkoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <p>注文保留に未確定の商品があります。<br />注文をせずに会計しますか？</p>
            <div className="modal-actions">
              <button type="button" className="modal-button" onClick={() => {
                setCheckoutConfirm(false); resetCart(); resetOrderHistory(); navigate('/checkout')
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
