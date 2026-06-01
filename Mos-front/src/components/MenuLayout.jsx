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

      // 滞在時間については本来はサーバーからの情報を元に計算するべきですが、DB実装までは固定値で表示しています
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
    </div>
  )
}
