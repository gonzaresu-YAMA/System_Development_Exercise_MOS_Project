import { Link } from 'react-router-dom'
import '../App.css'

export default function Home() {
  return (
    <div className="home-root">
      <div className="home-content">
        <div className="home-logo">
          <p className="home-logo-en">IZAKAYA MIDORI-TEI</p>
          <h1 className="home-logo-ja">居酒屋みどり亭</h1>
        </div>

        <div className="home-divider" />

        <div className="home-welcome">
          <p className="home-welcome-main">いらっしゃいませ</p>
          <p className="home-welcome-sub">ご利用方法をお選びください</p>
        </div>

        <div className="home-actions">
          <Link to="/course" className="home-btn home-btn-primary">
            ご注文はこちら
          </Link>

          <Link to="/staff" className="home-btn home-btn-ghost">
            スタッフ用
          </Link>
        </div>
      </div>
    </div>
  )
}
