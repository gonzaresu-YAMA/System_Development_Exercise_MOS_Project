import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { CartContext } from '../CartContext'
import '../menu.css'

export function MenuLayout({ activeTab, children, showCheckout, onCheckoutClick }) {
  const { cartCount } = useContext(CartContext)

  return (
    <div className="menu-screen">
      <header className="menu-header">
        <div className="menu-header-title">滞在時間</div>

        <div className="menu-header-content">
          <div className="remaining-time">
            <span>滞在時間</span>
            <strong>00:30</strong>
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
              to="/menu/free"
              className={`circle-button ${activeTab === 'free' ? 'is-active' : ''}`}
            >
              無料
              <br />
              備品
            </Link>

            <Link
              to="/order-confirm"
              className={`circle-button badge-parent ${activeTab === 'hold' ? 'is-active' : ''}`}
            >
              注文
              <br />
              保留
              <span className="badge">{cartCount}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="menu-content">{children}</main>

      <footer className="menu-footer">
        {showCheckout ? (
          <button
            type="button"
            className="footer-button checkout-button"
            onClick={onCheckoutClick}
          >
            お会計
          </button>
        ) : (
          <Link to="/menu/categories" className="footer-button">
            ホームへ
          </Link>
        )}

        <Link to="/order-send" className="footer-button badge-parent">
          注文送信
          <span className="badge">{cartCount}</span>
        </Link>

        <Link to="/call-staff" className="footer-button">
          店員呼び出し
        </Link>
      </footer>
    </div>
  )
}
