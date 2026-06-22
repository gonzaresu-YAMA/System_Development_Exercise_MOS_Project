import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CartContext } from '../contexts/CartContext'
import { getStayUntil, isNormalPlan } from '../utils/stayTimer'
import '../App.css'
import '../menu.css'

export function MenuLayout({ activeTab, children, showCheckout, onCheckoutClick }) {
  const { cartCount, resetCart, resetOrderHistory } = useContext(CartContext)
  const navigate = useNavigate()
  const location = useLocation()
  const unlimited = isNormalPlan()
  const [remainingSeconds, setRemainingSeconds] = useState(Infinity)

  const remainingLabel = useMemo(() => {
    if (unlimited || remainingSeconds === Infinity) return null
    if (remainingSeconds >= 60 * 60) {
      const h = Math.floor(remainingSeconds / 3600)
      const m = Math.floor((remainingSeconds % 3600) / 60)
      return `${h}時間${String(m).padStart(2, '0')}分`
    }
    const m = Math.floor(remainingSeconds / 60)
    const s = remainingSeconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [remainingSeconds, unlimited])

  useEffect(() => {
    if (unlimited) return
    const until = getStayUntil()
    const update = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((until - Date.now()) / 1000)))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [unlimited])

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/menu')
  }

  const handleExpiredCheckout = () => {
    resetCart()
    resetOrderHistory()
    navigate('/checkout')
  }

  const showBackButton = location.pathname !== '/menu'
  const isExpired = !unlimited && remainingSeconds <= 0
  const isExpiringSoon = !unlimited && remainingSeconds > 0 && remainingSeconds <= 10 * 60

  return (
    <div className="menu-screen">
      <header className="menu-header">
        <div className="menu-header-top">
          {showBackButton && (
            <button type="button" className="menu-header-back" onClick={handleBack}>
              ← 戻る
            </button>
          )}
          <div className="menu-header-title">居酒屋みどり亭</div>
        </div>

        <div className="menu-header-content">
          <div className="remaining-time">
            {unlimited ? (
              <span style={{ color: 'var(--gold)', fontSize: '0.72rem', letterSpacing: '0.06em' }}>通常プラン</span>
            ) : (
              <>
                <span>滞在残り</span>
                <strong>{remainingLabel}</strong>
              </>
            )}
          </div>

          <div className="menu-header-buttons">
            <Link
              to="/history"
              className={`circle-button ${activeTab === 'history' ? 'is-active' : ''}`}
            >
              注文
              <br />
              履歴
            </Link>

            <Link
              to="/menu/c/free"
              className={`circle-button ${activeTab === 'free' ? 'is-active' : ''}`}
            >
              無料
              <br />
              備品
            </Link>

            {isExpired ? (
              <button type="button" className="circle-button badge-parent is-disabled" disabled>
                注文
                <br />
                保留
                <span className="badge">{cartCount}</span>
              </button>
            ) : (
              <Link
                to="/order-confirm"
                className={`circle-button badge-parent ${activeTab === 'hold' ? 'is-active' : ''}`}
              >
                注文
                <br />
                保留
                <span className="badge">{cartCount}</span>
              </Link>
            )}
          </div>
        </div>

        {isExpiringSoon && !isExpired && (
          <div className="stay-warning-banner" role="status" aria-live="polite">
            まもなく滞在時間が終了します。時間が0になると注文できなくなります。
          </div>
        )}
      </header>

      <main className="menu-content">{children}</main>

      <footer className="menu-footer">
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

        <Link
          to="/call-staff"
          className={`footer-button ${activeTab === 'call' ? 'is-current' : ''}`}
        >
          店員呼出し
        </Link>
      </footer>

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
