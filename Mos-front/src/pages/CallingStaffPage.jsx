/**
 * CallingStaffPage.jsx — 店員呼び出し中ページ
 *
 * アクセス URL: /call-staff-calling
 *
 * 役割:
 *   「店員を呼ぶ」ボタンを押した後に表示される「呼び出し中」の状態画面。
 *   お客様に「スタッフが向かっています」と知らせる。
 *
 * ※ 現時点では実際にバックエンドへ呼び出し通知を送る処理は実装されていない。
 *    将来的には「店員を呼んだ」イベントを API で送信する実装が必要。
 *
 * 遷移: CallStaffPage → CallingStaffPage → /menu (メニューに戻る)
 */

import { Link } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import '../App.css'
import '../menu.css'

export default function CallingStaffPage() {
  return (
    <MenuLayout activeTab="call">
      <div className="call-staff-screen">
        <div className="call-staff-card">
          {/* 呼び出し中を示すアイコン（ベルの絵文字） */}
          <div className="calling-staff-icon">🔔</div>

          {/* 呼び出し中メッセージ */}
          <p className="calling-staff-msg">スタッフを呼び出し中</p>
          <p className="calling-staff-sub">
            只今スタッフが向かっております。
            <br />
            しばらくお待ちください。
          </p>

          {/* メニューに戻るリンク */}
          <Link to="/menu" className="call-back-btn">
            メニューに戻る
          </Link>
        </div>
      </div>
    </MenuLayout>
  )
}
