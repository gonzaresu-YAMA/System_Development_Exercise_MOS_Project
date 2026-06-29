/**
 * 認証ガード（ルートレベルのログインチェック）
 *
 * sessionStorage にユーザー情報がなければ "/" にリダイレクトする。
 * React Router の <Outlet /> パターンを使い、
 * 認証済みの場合は子ルートを描画し、未認証の場合はリダイレクトする。
 *
 * state={{ from: location.pathname }} をリダイレクト先に渡す理由:
 *   ログイン後に元のページに戻れるようにするため（将来の対応を見越した実装）
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getUser } from '../auth/auth'

export default function ProtectedRoute() {
  const location = useLocation()
  // sessionStorage からログイン済みユーザーを取得
  const user = getUser()

  if (!user) {
    // 未ログイン: リダイレクト元のパスを state に持たせてログイン画面へ
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  // ログイン済み: 子ルート（StaffLayout → AppShell）を描画
  return <Outlet />
}
