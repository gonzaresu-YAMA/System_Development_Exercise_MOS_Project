// アプリ全体のルーティング定義
// - /        : ログイン画面
// - /employee: ログイン後の共通シェル
// - それ以外 : ログイン画面へ戻す

import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../../features/auth/LoginPage'
import ProtectedRoute from './ProtectedRoute'
import StaffLayout from '../layout/StaffLayout'
import AppShell from '../layout/AppShell'

export default function AppRoutes() {
  return (
    <Routes>
      {/* ログイン画面 */}
      <Route path="/" element={<LoginPage />} />

      {/* ログイン済みユーザーだけ入れる領域 */}
      <Route element={<ProtectedRoute />}>
        <Route element={<StaffLayout />}>
          <Route path="/employee" element={<AppShell />} />
        </Route>
      </Route>

      {/* 未定義パスはルートへ戻す */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
