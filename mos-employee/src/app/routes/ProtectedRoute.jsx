// ログイン済みかどうかだけを見る最小ガード
// 認可（役職・用途）は RoleRoute や AppShell 側で扱う

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getUser } from '../auth/auth'

export default function ProtectedRoute() {
  const location = useLocation()
  const user = getUser()

  // 未ログインならログイン画面へ戻す
  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
