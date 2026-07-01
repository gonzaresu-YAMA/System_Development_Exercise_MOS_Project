/**
 * Employee - Mos-front 側のスタッフ用プレースホルダ画面
 *
 * Mos-front の /employee ルートに割り当てられた古い実装。
 * 現在は mos-employee（別プロジェクト）が本番の従業員管理画面を担当しており、
 * このコンポーネントは将来の拡張または移行前の残骸として残っている。
 *
 * ユーザー情報の渡し方:
 *   React Router の navigate('/employee', { state: user }) で state に渡す。
 *   useLocation().state で受け取る（URL に含まれないため QR コードには残らない）。
 */
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import './Employee.css'

function Employee() {
  const navigate = useNavigate()
  // useLocation().state に navigate で渡したユーザーオブジェクトが入っている
  const { state: user } = useLocation()
  // ユーザーアイコンのポップアップ開閉状態
  const [open, setOpen] = useState(false)
  // ユーザーアイコン要素の参照（クリック外検知に使用）
  const ref = useRef(null)

  // 未ログインガード: state に user がない場合はトップに戻す
  useEffect(() => {
    if (!user) navigate('/')
  }, [user, navigate])

  // ユーザーアイコン以外の場所をクリックするとポップアップを閉じる
  // contains() でクリックがユーザーエリア内かどうかを判定する
  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  // user が null の間は何も描画しない（navigate のリダイレクト待ち）
  if (!user) return null

  return (
    <>
      <header className="header">
        <div className="user-area" ref={ref}>
          {/* アイコンに名前の頭文字を表示。名前がなければ '？' */}
          <button className="user-icon" onClick={() => setOpen(!open)}>
            {user.name?.[0] ?? '？'}
          </button>

          {/* open が true のときだけポップアップを表示 */}
          {open && (
            <div className="user-pop">
              <p><strong>{user.name}</strong></p>
              <p>ID: {user.id}</p>
              {/* ログアウト: '/' に戻るだけ（state のクリアは行っていない） */}
              <button onClick={() => navigate('/')}>ログアウト</button>
            </div>
          )}
        </div>
      </header>

      <main className="center">
        <h2>ホーム</h2>

        {/* 役職によって表示内容を切り替える */}
        {user.role === 'manager' ? (
          <p>📊 店長メニュー（売上・管理）</p>
        ) : (
          <p>🧾 従業員メニュー（注文・作業）</p>
        )}
      </main>
    </>
  )
}

export default Employee
