/**
 * スタッフ用ルートのラッパーレイアウト
 *
 * 現在は <Outlet /> を返すだけのパス素通し用コンポーネント。
 * ここに将来共通のヘッダーやフッター、エラーバウンダリなどを
 * 追加することを見越してレイアウト層として切り出してある。
 *
 * React Router のネストルートでは、親 Route の element に
 * <Outlet /> を置くと子 Route の element が描画される仕組み。
 */
import { Outlet } from 'react-router-dom'

export default function StaffLayout() {
  // 子ルート（AppShell）をそのまま描画する
  return <Outlet />
}
