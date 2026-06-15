import { Navigate, Outlet } from 'react-router-dom'
import { getUser, getUseCase } from '../auth/auth'

export default function RoleRoute({
  allowedRoles = [],
  allowedUseCases = [],
  redirectTo = '/employee',
}) {
  const user = getUser()
  const useCase = getUseCase()

  if (!user) return <Navigate to="/" replace />

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />
  }

  if (allowedUseCases.length > 0 && !allowedUseCases.includes(useCase)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
