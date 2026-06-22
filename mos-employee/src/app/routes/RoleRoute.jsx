// 役職 / 用途ベースの認可ガード
// 将来 URL をさらに細かく分ける時に使えるよう、先に共通部品として用意している

import { Navigate, Outlet } from 'react-router-dom'
import { getUser, getUseCase } from '../auth/auth'

export default function RoleRoute({
  allowedRoles = [],
  allowedUseCases = [],
  redirectTo = '/employee',
}) {
  const user = getUser()
  const useCase = getUseCase()

  // ログインしていなければルートへ戻す
  if (!user) return <Navigate to="/" replace />

  // 許可されていない役職なら戻す
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />
  }

  // 許可されていない用途なら戻す
  if (allowedUseCases.length > 0 && !allowedUseCases.includes(useCase)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
