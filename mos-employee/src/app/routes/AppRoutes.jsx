import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../../features/auth/LoginPage'
import ProtectedRoute from './ProtectedRoute'
import StaffLayout from '../layout/StaffLayout'
import AppShell from '../layout/AppShell'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<StaffLayout />}>
          <Route path="/employee" element={<AppShell />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
