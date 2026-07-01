/**
 * ロール・ユースケースによるアクセス制限ガード
 *
 * ProtectedRoute（ログインチェック）の上位版。
 * 役職（role）や用途（useCase）が一致しない場合にアクセスを弾く。
 *
 * Props:
 *   allowedRoles     - アクセスを許可する役職（例: ['manager']）
 *   allowedUseCases  - アクセスを許可する用途（例: ['admin']）
 *   redirectTo       - 権限不足時のリダイレクト先（デフォルト: '/employee'）
 *
 * 現在の実装では AppShell 側でロール判定を行っているため、
 * このコンポーネントはルートに直接組み込まれていないが、
 * 将来より細かいルートレベルの権限制御が必要になったときに使える。
 */
import { Navigate, Outlet } from 'react-router-dom'
import { getUser, getUseCase } from '../auth/auth'

export default function RoleRoute({
  allowedRoles = [],
  allowedUseCases = [],
  redirectTo = '/employee',
}) {
  const user = getUser()
  const useCase = getUseCase()

  // そもそもログインしていない場合はログイン画面へ
  if (!user) return <Navigate to="/" replace />

  // 役職チェック: allowedRoles が指定されていて、該当しなければリダイレクト
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />
  }

  // ユースケースチェック: allowedUseCases が指定されていて、該当しなければリダイレクト
  if (allowedUseCases.length > 0 && !allowedUseCases.includes(useCase)) {
    return <Navigate to={redirectTo} replace />
  }

  // すべての条件を満たした場合、子ルートを描画
  return <Outlet />
}
