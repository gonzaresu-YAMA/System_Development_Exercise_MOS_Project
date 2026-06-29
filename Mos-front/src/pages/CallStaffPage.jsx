/**
 * CallStaffPage.jsx — 店員呼び出し確認ページ
 *
 * アクセス URL: /call-staff
 *
 * 役割:
 *   「店員を呼ぶ」ボタンを表示する画面。
 *   ボタンを押すと /call-staff-calling（呼び出し中画面）へ遷移する。
 *
 * 「なぜ2画面に分かれているのか?」
 *   誤操作での呼び出しを防ぐため、確認画面（このページ）と
 *   呼び出し中画面（CallingStaffPage）の2ステップにしている。
 *   このページでは「キャンセル」でメニューに戻れる。
 */

// Link: <a> タグの React Router 版。クリックでページをリロードせずに遷移する
import { Link } from 'react-router-dom'
import { MenuLayout } from '../components/MenuLayout'
import '../App.css'
import '../menu.css'

export default function CallStaffPage() {
  return (
    // activeTab="call": フッターの「店員呼出し」ボタンをハイライトする
    <MenuLayout activeTab="call">
      <div className="call-staff-screen">
        <div className="call-staff-card">
          <h2 className="call-staff-title">店員の呼び出し</h2>
          <p className="call-staff-desc">
            ご用の際はボタンを押してください。
            <br />
            スタッフがすぐに参ります。
          </p>

          {/* 「店員を呼ぶ」ボタン → /call-staff-calling に遷移 */}
          <Link to="/call-staff-calling" className="call-staff-btn">
            店員を呼ぶ
          </Link>

          {/* 「キャンセル」リンク → /menu（メニューブック）に戻る */}
          <Link to="/menu" className="call-back-btn">
            キャンセル
          </Link>
        </div>
      </div>
    </MenuLayout>
  )
}
