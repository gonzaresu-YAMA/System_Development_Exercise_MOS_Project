import { Link } from 'react-router-dom'
import '../App.css'

export default function StaffPage() {
  return (
    <div className="staff-page-root">
      <div className="staff-page-card">
        <h2 className="staff-page-title">スタッフ用画面</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: 1.7 }}>
          スタッフ管理システムへはこちらからアクセスします。
        </p>
        <Link to="/" className="staff-page-link">
          ← トップへ戻る
        </Link>
      </div>
    </div>
  )
}
