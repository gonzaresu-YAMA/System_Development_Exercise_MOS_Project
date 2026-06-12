import { Link } from 'react-router-dom'
import '../App.css'

export default function StaffPage() {
  return (
    <div className="page-content">
      <h2>スタッフ用画面</h2>
      <p>スタッフ専用の管理機能へアクセスします。</p>

      <Link to="/home" className="nav-button back-button">
        トップへ戻る
      </Link>
    </div>
  )
}
