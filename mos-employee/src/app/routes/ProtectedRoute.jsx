import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getUser } from '../auth/auth'

export default function ProtectedRoute() {
  const location = useLocation()
  const user = getUser()

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
