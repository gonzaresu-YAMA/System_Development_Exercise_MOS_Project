// レイアウトの薄いラッパー
// 将来レイアウトを追加したくなっても Outlet だけ差し替えれば済むようにしている

import { Outlet } from 'react-router-dom'

export default function StaffLayout() {
  return <Outlet />
}
