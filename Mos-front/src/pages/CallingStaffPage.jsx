import { Link } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import '../App.css'
import '../menu.css'

export default function CallingStaffPage() {
  return (
    <MenuLayout activeTab="call">
      <div className="call-staff-screen">
        <div className="call-staff-card">
          <div className="calling-staff-icon">🔔</div>
          <p className="calling-staff-msg">スタッフを呼び出し中</p>
          <p className="calling-staff-sub">
            只今スタッフが向かっております。
            <br />
            しばらくお待ちください。
          </p>
          <Link to="/menu" className="call-back-btn">
            メニューに戻る
          </Link>
        </div>
      </div>
    </MenuLayout>
  )
}
