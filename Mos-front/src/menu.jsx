import { Link } from "react-router-dom";
import "./menu.css";

const hasOrderHistory = false;

const menuItems = [
  { id: 1, name: "おしぼり", price: 100, image: "/oshibori.png", soldOut: false },
  { id: 2, name: "小皿", price: 0, image: "/kozara.png", soldOut: true },
  { id: 3, name: "グラス", price: 0, image: "/glass.png", soldOut: true },
  { id: 4, name: "割り箸", price: 0, image: "", soldOut: true },
  { id: 5, name: "お冷", price: 0, image: "", soldOut: true },
  { id: 6, name: "□□", price: 0, image: "", soldOut: false },
  { id: 7, name: "□□", price: 0, image: "", soldOut: false },
  { id: 8, name: "□□", price: 0, image: "", soldOut: false },
];

function MenuLayout({ activeTab, children }) {
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
            {hasOrderHistory ? (
              <Link
                to="/history"
                className={`circle-button ${activeTab === "history" ? "is-active" : ""}`}
              >
                注文
                <br />
                履歴
              </Link>
            ) : (
              <span
                className={`circle-button is-disabled ${activeTab === "history" ? "is-active" : ""}`}
                aria-disabled="true"
              >
                注文
                <br />
                履歴
              </span>
            )}

            <Link
              to="/menu"
              className={`circle-button ${activeTab === "free" ? "is-active" : ""}`}
            >
              無料
              <br />
              備品
            </Link>

            <Link
              to="/order-confirm"
              className={`circle-button badge-parent ${activeTab === "hold" ? "is-active" : ""}`}
            >
              注文
              <br />
              保留
              <span className="badge">0</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="menu-content">{children}</main>

      <footer className="menu-footer">
        <Link to="/customer" className="footer-button">
          ホームへ
        </Link>

        <Link to="/order-send" className="footer-button badge-parent">
          注文送信
          <span className="badge">0</span>
        </Link>

        <Link to="/call-staff" className="footer-button">
          店員呼び出し
        </Link>
      </footer>
    </div>
  );
}

export default function MenuPage() {
  return (
    <MenuLayout activeTab="free">
      <div className="menu-grid">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-card ${item.soldOut ? "is-sold-out" : ""}`}
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
              <p className="menu-item-price">{item.price}￥</p>

              <button
                type="button"
                className="cart-button"
                disabled={item.soldOut}
              >
                カートに入れる
              </button>
            </div>
          </div>
        ))}
      </div>
    </MenuLayout>
  );
}

export function HistoryPage() {
  return (
    <MenuLayout activeTab="history">
      <div className="history-card">
        {!hasOrderHistory && (
          <div className="history-empty-state">注文履歴はまだありません。</div>
        )}
        <table className="history-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>数量</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
            <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
            <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
            <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
            <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
            <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
          </tbody>
        </table>
        <div className="history-pagination">
          <span>◀</span>
          <span>1/1</span>
          <span>▶</span>
        </div>
      </div>
    </MenuLayout>
  );
}

export function OrderConfirmPage() {
  return (
    <MenuLayout activeTab="hold">
      <div className="modal-overlay">
        <div className="modal-card">
          <p>注文保留がありません。</p>
          <Link to="/menu" className="modal-button is-dark">戻る</Link>
        </div>
      </div>
    </MenuLayout>
  );
}

export function OrderSendPage() {
  return (
    <MenuLayout activeTab="free">
      <div className="modal-overlay">
        <div className="modal-card">
          <p>注文を確定しますか？</p>
          <div className="modal-actions">
            <button type="button" className="modal-button">はい</button>
            <Link to="/menu" className="modal-button is-dark">いいえ</Link>
          </div>
        </div>
      </div>
    </MenuLayout>
  );
}

export function CallStaffPage() {
  return (
    <MenuLayout activeTab="free">
      <div className="modal-overlay">
        <div className="modal-card">
          <p>店員を呼び出しますか？</p>
          <div className="modal-actions">
            <button type="button" className="modal-button">呼び出す</button>
            <Link to="/menu" className="modal-button is-dark">キャンセル</Link>
          </div>
        </div>
      </div>
    </MenuLayout>
  );
}

