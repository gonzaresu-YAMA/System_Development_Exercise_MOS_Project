import { Link } from 'react-router-dom'
import '../App.css'

export default function Home() {
  return (
    <>
      <div className="page-title">
        <h1>居酒屋みどり亭</h1>
      </div>

      <div className="welcome-text">
        <h1>いらっしゃいませ</h1>
        <h2>ボタンをお選びください</h2>
      </div>

      <div className="button-row">
        <Link to="/menu/categories" className="nav-button customer-button">
          お客様用画面へ移行
        </Link>
      </div>

      <Link to="/staff" className="nav-button staff-button">
        スタッフ用画面
      </Link>
    </>
  )
}
