import { Link } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import '../App.css'
import '../menu.css'

export default function CallStaffPage() {
  return (
    <MenuLayout activeTab="call">
      <div className="call-staff-screen">
        <div className="call-staff-card">
          <h2 className="call-staff-title">店員の呼び出し</h2>
          <p className="call-staff-desc">
            ご用の際はボタンを押してください。
            <br />
            スタッフがすぐに参ります。
          </p>
          <Link to="/call-staff-calling" className="call-staff-btn">
            店員を呼ぶ
          </Link>
          <Link to="/menu" className="call-back-btn">
            キャンセル
          </Link>
        </div>
      </div>
    </MenuLayout>
  )
}
