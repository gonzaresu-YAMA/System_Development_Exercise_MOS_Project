/**
 * StaffPage.jsx — スタッフ用ページ
 *
 * アクセス URL: /staff
 *
 * 役割:
 *   従業員向けの管理システムへの入口ページ。
 *   ホーム画面の「スタッフ用」ボタンからアクセスする。
 *
 * ※ 従業員向けの実際の管理機能は /employee（Employee.jsx）に実装されている。
 *    このページは現時点では「トップへ戻る」リンクのみのシンプルなプレースホルダー。
 *    将来的にスタッフ認証（パスワード入力など）のゲートとして使える。
 */

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

        {/* トップ（ホーム画面）へ戻るリンク */}
        <Link to="/" className="staff-page-link">
          ← トップへ戻る
        </Link>
      </div>
    </div>
  )
}
