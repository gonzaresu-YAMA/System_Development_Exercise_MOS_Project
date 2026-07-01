/**
 * アプリ全体のルート定義
 *
 * ページ遷移の構成:
 *   /          → LoginPage（ログイン画面）
 *   /employee  → ProtectedRoute → StaffLayout → AppShell（メイン業務画面）
 *   それ以外   → "/" にリダイレクト（存在しないURLを防ぐ）
 *
 * ネスト構造の意味:
 *   ProtectedRoute が「ログインしていない場合は / に強制リダイレクト」を担当
 *   StaffLayout が「将来の共通レイアウト（ヘッダー等）」を担当（現在は素通し）
 *   AppShell が実際の業務画面（用途選択・注文・座席・管理）を描画
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../../features/auth/LoginPage'
import ProtectedRoute from './ProtectedRoute'
import StaffLayout from '../layout/StaffLayout'
import AppShell from '../layout/AppShell'

export default function AppRoutes() {
  return (
    <Routes>
      {/* ログイン画面 - 認証前はここに留まる */}
      <Route path="/" element={<LoginPage />} />

      {/* ProtectedRoute が認証チェックを担当
          ログイン済みなら <Outlet /> = StaffLayout を描画し、
          未ログインなら "/" にリダイレクト */}
      <Route element={<ProtectedRoute />}>
        <Route element={<StaffLayout />}>
          {/* 業務メイン画面 - 用途選択・注文管理・座席管理などがここから起動 */}
          <Route path="/employee" element={<AppShell />} />
        </Route>
      </Route>

      {/* 未定義パスはすべてログイン画面に戻す */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
