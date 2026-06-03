import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CartContext } from '../CartContext'
import { getRemainingSeconds, getStayUntil } from '../utils/stayTimer'
import '../menu.css'

export function MenuLayout({ activeTab, children, showCheckout, onCheckoutClick }) {
  const { cartCount } = useContext(CartContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds())

  const remainingLabel = useMemo(() => {
    if (remainingSeconds >= 60 * 60) {
      const hours = Math.floor(remainingSeconds / 3600)
      const minutes = Math.floor((remainingSeconds % 3600) / 60)
      return `${hours}時間${String(minutes).padStart(2, '0')}分`
    }

    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, [remainingSeconds])

  useEffect(() => {
    const initialUntil = getStayUntil()

    const updateRemaining = () => {
      const diffSeconds = Math.max(0, Math.ceil((initialUntil - Date.now()) / 1000))
      setRemainingSeconds(diffSeconds)
    }

    updateRemaining()
    const timerId = setInterval(updateRemaining, 1000)

    return () => clearInterval(timerId)
  }, [])

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/menu')
    }
  }

  const showBackButton = location.pathname !== '/menu'
  const isExpired = remainingSeconds <= 0
  const warningThresholdSeconds = 10 * 60
  const isExpiringSoon = remainingSeconds > 0 && remainingSeconds <= warningThresholdSeconds

  const handleExpiredCheckout = () => {
    navigate('/checkout')
  }

  
  return (
    <div className="menu-screen">
      <header className="menu-header">
        {showBackButton && (
          <button
            type="button"
            className="menu-header-back"
            onClick={handleBack}
          >
            戻る
          </button>
        )}

        <div className="menu-header-content">
          <div className="remaining-time">
            <span>滞在時間</span>
            <strong>{remainingLabel}</strong>
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
              <button
                type="button"
                className="circle-button badge-parent is-disabled"
                disabled
              >
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
            まもなく滞在時間が終了します。滞在時間が0になると注文ができなくなります。
          </div>
        )}

      </header>

      <main className="menu-content">{children}</main>

      <footer className="menu-footer">
        {showCheckout ? (
          <button
            type="button"
            className={`footer-button checkout-button ${activeTab === 'categories' ? 'is-current' : ''} ${isExpired ? 'is-disabled' : ''}`}
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
            ホームへ
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
          店員呼び出し
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
            <button
              type="button"
              className="stay-expired-action"
              onClick={handleExpiredCheckout}
            >
              お会計へ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
